import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderNotificationEmail } from "@/lib/notification-templates";

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const PROCESSING_STALE_AFTER_MS = 15 * 60 * 1000;
const RETRY_DELAYS_MS = [5, 15, 45, 135].map(minutes => minutes * 60 * 1000);

class EmailProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "EmailProviderError";
  }
}

export function notificationIdempotencyKey(notificationId: string) {
  return `amaana-notification/${notificationId}`;
}

export function notificationRetryDelayMs(attemptNumber: number) {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new Error("Notification attempt number must be a positive integer");
  }
  return RETRY_DELAYS_MS[Math.min(attemptNumber - 1, RETRY_DELAYS_MS.length - 1)];
}

export function isRetryableEmailProviderResponse(status: number, providerCode?: string | null) {
  if (status === 409) return providerCode === "concurrent_idempotent_requests";
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function sendWithResend(
  notificationId: string,
  recipient: string,
  subject: string,
  text: string,
  html: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new EmailProviderError("Email delivery is not configured", false);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": notificationIdempotencyKey(notificationId),
    },
    body: JSON.stringify({ from, to: [recipient], subject, text, html }),
  });

  if (!response.ok) {
    let providerCode: string | null = null;
    try {
      const payload = await response.json() as { name?: unknown; code?: unknown };
      providerCode = typeof payload.name === "string"
        ? payload.name
        : typeof payload.code === "string"
          ? payload.code
          : null;
    } catch {
      // Status alone is enough to classify non-409 transient failures.
    }

    throw new EmailProviderError(
      `Email provider returned ${response.status}${providerCode ? ` (${providerCode})` : ""}`,
      isRetryableEmailProviderResponse(response.status, providerCode),
    );
  }

  try {
    const payload = await response.json() as { id?: unknown };
    return typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : null;
  } catch {
    return null;
  }
}

async function recoverStaleProcessingNotifications() {
  const staleBefore = new Date(Date.now() - PROCESSING_STALE_AFTER_MS);
  await prisma.notification.updateMany({
    where: {
      channel: "EMAIL",
      status: NotificationStatus.PROCESSING,
      updatedAt: { lt: staleBefore },
      attempts: { lt: MAX_ATTEMPTS },
    },
    data: {
      status: NotificationStatus.FAILED,
      failureReason: "Recovered after an interrupted notification delivery attempt.",
      scheduledFor: new Date(),
    },
  });

  await prisma.notification.updateMany({
    where: {
      channel: "EMAIL",
      status: NotificationStatus.PROCESSING,
      updatedAt: { lt: staleBefore },
      attempts: { gte: MAX_ATTEMPTS },
    },
    data: {
      status: NotificationStatus.FAILED,
      failureReason: "Recovered after an interrupted final notification delivery attempt; manual review is required.",
      scheduledFor: new Date("9999-12-31T23:59:59.999Z"),
    },
  });
}

export async function processPendingEmailNotifications() {
  await recoverStaleProcessingNotifications();

  const pending = await prisma.notification.findMany({
    where: {
      channel: "EMAIL",
      status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
      attempts: { lt: MAX_ATTEMPTS },
      scheduledFor: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_BATCH_SIZE,
  });

  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    const claimed = await prisma.notification.updateMany({
      where: {
        id: notification.id,
        status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
        attempts: { lt: MAX_ATTEMPTS },
      },
      data: {
        status: NotificationStatus.PROCESSING,
        attempts: { increment: 1 },
        failureReason: null,
      },
    });
    if (claimed.count !== 1) continue;

    const attemptNumber = notification.attempts + 1;

    try {
      const rendered = renderNotificationEmail(
        notification.templateKey,
        notification.payload as Record<string, unknown>,
        notification.subject,
      );
      const providerMessageId = await sendWithResend(
        notification.id,
        notification.recipient,
        rendered.subject,
        rendered.text,
        rendered.html,
      );
      const completed = await prisma.notification.updateMany({
        where: { id: notification.id, status: NotificationStatus.PROCESSING, attempts: attemptNumber },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          providerMessageId,
          failureReason: null,
        },
      });
      if (completed.count !== 1) {
        throw new Error("Notification delivery state changed after provider acceptance");
      }
      sent += 1;
    } catch (error) {
      const failureReason = error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error";
      const retryable = !(error instanceof EmailProviderError) || error.retryable;
      const attemptsRemain = attemptNumber < MAX_ATTEMPTS;

      const failedClaim = await prisma.notification.updateMany({
        where: { id: notification.id, status: NotificationStatus.PROCESSING, attempts: attemptNumber },
        data: {
          status: NotificationStatus.FAILED,
          failureReason,
          scheduledFor: retryable && attemptsRemain
            ? new Date(Date.now() + notificationRetryDelayMs(attemptNumber))
            : new Date("9999-12-31T23:59:59.999Z"),
        },
      });
      if (failedClaim.count === 1) failed += 1;
    }
  }

  return { selected: pending.length, sent, failed };
}
