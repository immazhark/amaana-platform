"use server";

import { NotificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requeueFailedNotification(formData: FormData) {
  const user = await requirePermission("notification.manage");
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id) throw new Error("Notification is required");
  if (reason.length < 10) throw new Error("Provide a short operational reason before requeueing");

  const current = await prisma.notification.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      status: true,
      channel: true,
      attempts: true,
      failureReason: true,
      recipient: true,
      templateKey: true,
    },
  });

  if (current.channel !== "EMAIL") throw new Error("Only email notifications can be manually requeued here");
  if (current.status !== NotificationStatus.FAILED) {
    throw new Error("Only failed notifications can be manually requeued");
  }

  await prisma.$transaction([
    prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        failureReason: null,
        scheduledFor: new Date(),
        sentAt: null,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "notification.manual_requeue",
        entityType: "Notification",
        entityId: id,
        metadata: {
          reason: reason.slice(0, 1000),
          previousAttempts: current.attempts,
          previousFailureReason: current.failureReason,
          recipient: current.recipient,
          templateKey: current.templateKey,
        },
      },
    }),
  ]);

  revalidatePath("/admin/notifications");
}
