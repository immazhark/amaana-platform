import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  updateNotification: vi.fn(),
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
      update: mocks.updateNotification,
    },
    auditEvent: { create: mocks.createAudit },
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
      recipient: "donor@example.test",
      templateKey: "donation-acknowledgement",
    });
    mocks.updateNotification.mockResolvedValue({ id: "notification_123" });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.transaction.mockResolvedValue([]);
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
      recipient: "donor@example.test",
      templateKey: "donation-acknowledgement",
    });

    await expect(requeueFailedNotification(form())).rejects.toThrow(/Only failed notifications/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires a meaningful operator reason", async () => {
    await expect(requeueFailedNotification(form("fixed"))).rejects.toThrow(/operational reason/i);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("resets the failed notification for the existing idempotent worker and records audit context", async () => {
    await requeueFailedNotification(form());

    expect(mocks.updateNotification).toHaveBeenCalledWith({
      where: { id: "notification_123" },
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
          recipient: "donor@example.test",
          templateKey: "donation-acknowledgement",
        }),
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/notifications");
  });
});
