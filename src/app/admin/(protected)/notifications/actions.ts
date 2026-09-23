"use server";

import { NotificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

export async function enqueueControlledEmailAcceptance() {
  const user = await requirePermission("notification.manage");

  await withSerializableTransactionRetry(async tx => {
    const existing = await tx.notification.findFirst({
      where: {
        userId: user.id,
        channel: "EMAIL",
        templateKey: "operational-email-acceptance",
        status: { in: [NotificationStatus.PENDING, NotificationStatus.PROCESSING] },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new Error("A controlled acceptance email is already queued or processing for this account.");
    }

    const notification = await tx.notification.create({
      data: {
        channel: "EMAIL",
        recipient: user.email,
        templateKey: "operational-email-acceptance",
        subject: "Amaana Foundation transactional email acceptance",
        payload: { acceptanceType: "transactional-email" },
        userId: user.id,
      },
      select: { id: true },
    });

    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "notification.acceptance_enqueued",
        entityType: "Notification",
        entityId: notification.id,
        metadata: {
          recipientScope: "current-authorised-staff-account",
          templateKey: "operational-email-acceptance",
        },
      },
    });
  });

  revalidatePath("/admin/notifications");
}

export async function requeueFailedNotification(formData: FormData) {
  const user = await requirePermission("notification.manage");
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id) throw new Error("Notification is required");
  if (reason.length < 10) throw new Error("Provide a short operational reason before requeueing");
  if (reason.length > 1000) throw new Error("Operational reason is too long");

  await withSerializableTransactionRetry(async tx => {
    const current = await tx.notification.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        status: true,
        channel: true,
        attempts: true,
        failureReason: true,
        templateKey: true,
      },
    });

    if (current.channel !== "EMAIL") throw new Error("Only email notifications can be manually requeued here");
    if (current.status !== NotificationStatus.FAILED) {
      throw new Error("Only failed notifications can be manually requeued");
    }

    const claimed = await tx.notification.updateMany({
      where: {
        id,
        status: NotificationStatus.FAILED,
      },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        failureReason: null,
        scheduledFor: new Date(),
        sentAt: null,
      },
    });

    if (claimed.count !== 1) {
      throw new Error("Notification state changed before it could be requeued. Refresh and review the current delivery state.");
    }

    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "notification.manual_requeue",
        entityType: "Notification",
        entityId: id,
        metadata: {
          reason: reason.slice(0, 1000),
          previousAttempts: current.attempts,
          previousFailureReason: current.failureReason,
          templateKey: current.templateKey,
        },
      },
    });
  });

  revalidatePath("/admin/notifications");
}
