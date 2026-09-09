import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderNotificationEmail } from "@/lib/notification-templates";

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

async function sendWithResend(recipient: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient], subject, text, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

export async function processPendingEmailNotifications() {
  const pending = await prisma.notification.findMany({
    where: { channel: "EMAIL", status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] }, attempts: { lt: MAX_ATTEMPTS }, scheduledFor: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: MAX_BATCH_SIZE,
  });

  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    const claimed = await prisma.notification.updateMany({ where: { id: notification.id, status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] } }, data: { status: NotificationStatus.PROCESSING, attempts: { increment: 1 }, failureReason: null } });
    if (claimed.count !== 1) continue;
    try {
      const rendered = renderNotificationEmail(notification.templateKey, notification.payload as Record<string, unknown>, notification.subject);
      await sendWithResend(notification.recipient, rendered.subject, rendered.text, rendered.html);
      await prisma.notification.update({ where: { id: notification.id }, data: { status: NotificationStatus.SENT, sentAt: new Date() } });
      sent += 1;
    } catch (error) {
      const failureReason = error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error";
      await prisma.notification.update({ where: { id: notification.id }, data: { status: NotificationStatus.FAILED, failureReason, scheduledFor: new Date(Date.now() + 15 * 60 * 1000) } });
      failed += 1;
    }
  }
  return { selected: pending.length, sent, failed };
}
