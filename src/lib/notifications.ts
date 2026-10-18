import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { renderNotificationEmail } from "@/lib/notification-templates";

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const EMAIL_PROVIDER_TIMEOUT_MS = 15_000;
const MAX_EMAIL_PROVIDER_RESPONSE_BYTES = 16 * 1024;
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
  const delay = RETRY_DELAYS_MS[Math.min(attemptNumber - 1, RETRY_DELAYS_MS.length - 1)];
  if (delay === undefined) throw new Error("Notification retry schedule is empty");
  return delay;
}

export function isRetryableEmailProviderResponse(status: number, providerCode?: string | null) {
  if (status === 409) return providerCode === "concurrent_idempotent_requests";
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function parseResendResponse(response: Response): Promise<unknown> {
  // Provider receipts and error bodies are external input. Do not parse
  // unrestricted JSON, even when the HTTP status is successful.
  const raw = await readTextBodyWithLimit(response, MAX_EMAIL_PROVIDER_RESPONSE_BYTES, {
    timeoutMs: EMAIL_PROVIDER_TIMEOUT_MS,
  });
  return JSON.parse(raw) as unknown;
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
    redirect: "error",
    signal: AbortSignal.timeout(EMAIL_PROVIDER_TIMEOUT_MS),
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
      const payload = await parseResendResponse(response) as { name?: unknown; code?: unknown };
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

  let providerMessageId: unknown;
  try {
    const payload = await parseResendResponse(response) as { id?: unknown };
    providerMessageId = payload?.id;
  } catch {
    // A 2xx response without a parseable provider receipt is not evidence
    // of completed delivery. Keep the stable idempotency key for retry.
    throw new EmailProviderError("Email provider returned an unreadable receipt", true);
  }
  if (typeof providerMessageId !== "string" || !providerMessageId.trim()) {
    throw new EmailProviderError("Email provider returned an invalid receipt", true);
  }
  return providerMessageId.trim();
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
        // Bind completion ownership to the version selected by this worker.
        // Another attempt may have finished while this snapshot was waiting.
        attempts: { equals: notification.attempts, lt: MAX_ATTEMPTS },
        // Recheck eligibility atomically: another worker may have deferred this row
        // after our findMany snapshot, but before we can claim it.
        scheduledFor: { lte: new Date() },
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
        // The provider already accepted this idempotent delivery, but another
        // worker/admin changed the local row before our completion claim.
        // Never reinterpret that concurrency outcome as a provider failure or
        // overwrite the newer state with FAILED.
        continue;
      }
      sent += 1;
    } catch (error) {
      const failureReason = error instanceof EmailProviderError
        ? error.message.slice(0, 500)
        : "Unexpected notification delivery failure";
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
