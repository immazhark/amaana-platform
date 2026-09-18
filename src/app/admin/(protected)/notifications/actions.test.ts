import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  updateNotificationMany: vi.fn(),
  createAudit: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
    },
    $transaction: mocks.transaction,
  },
}));

import { requeueFailedNotification } from "./actions";

function form(reason = "Provider configuration was corrected and delivery may be retried.") {
  const data = new FormData();
  data.set("id", "notification_123");
  data.set("reason", reason);
  return data;
}

describe("manual notification recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "notification_123",
      status: NotificationStatus.FAILED,
      channel: "EMAIL",
      attempts: 5,
      failureReason: "Email delivery is not configured",
      templateKey: "donation-acknowledgement",
    });
    mocks.updateNotificationMany.mockResolvedValue({ count: 1 });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.transaction.mockImplementation(async callback => callback({
      notification: { updateMany: mocks.updateNotificationMany },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  it("requires notification.manage permission", async () => {
    await requeueFailedNotification(form());
    expect(mocks.requirePermission).toHaveBeenCalledWith("notification.manage");
  });

  it("requeues only FAILED email notifications", async () => {
    mocks.findUniqueOrThrow.mockResolvedValueOnce({
      id: "notification_123",
      status: NotificationStatus.SENT,
      channel: "EMAIL",
      attempts: 1,
      failureReason: null,
      templateKey: "donation-acknowledgement",
    });

    await expect(requeueFailedNotification(form())).rejects.toThrow(/Only failed notifications/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires a meaningful operator reason", async () => {
    await expect(requeueFailedNotification(form("fixed"))).rejects.toThrow(/operational reason/i);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
  });


  it("fails closed when another worker changes the notification before the manual claim", async () => {
    mocks.updateNotificationMany.mockResolvedValueOnce({ count: 0 });

    await expect(requeueFailedNotification(form())).rejects.toThrow(/state changed/i);

    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("resets the failed notification for the existing idempotent worker and records audit context", async () => {
    await requeueFailedNotification(form());

    expect(mocks.updateNotificationMany).toHaveBeenCalledWith({
      where: {
        id: "notification_123",
        status: NotificationStatus.FAILED,
      },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        failureReason: null,
        scheduledFor: expect.any(Date),
        sentAt: null,
      },
    });
    expect(mocks.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user_123",
        action: "notification.manual_requeue",
        entityType: "Notification",
        entityId: "notification_123",
        metadata: expect.objectContaining({
          previousAttempts: 5,
          previousFailureReason: "Email delivery is not configured",
          templateKey: "donation-acknowledgement",
        }),
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/notifications");
  });
});
