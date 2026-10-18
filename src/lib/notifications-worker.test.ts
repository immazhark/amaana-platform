import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  renderNotificationEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/notification-templates", () => ({
  renderNotificationEmail: mocks.renderNotificationEmail,
}));

import { processPendingEmailNotifications } from "./notifications";

// Exercise the actual bounded provider response stream while retaining the
// existing independent outbound-request spies and deterministic fixtures.
function stubProvider(fetchMock: unknown) {
  if (typeof fetchMock !== "function") throw new TypeError("Synthetic email provider fixture is not callable");
  vi.stubGlobal("fetch", async (...args: Parameters<typeof fetch>) => {
    const result: unknown = await fetchMock(...args);
    if (result instanceof Response) return result;
    const fixture = result as { ok: boolean; status?: number; json: () => Promise<unknown> };
    return new Response(JSON.stringify(await fixture.json()), {
      status: fixture.status ?? (fixture.ok ? 200 : 502),
      headers: { "content-type": "application/json" },
    });
  });
}


const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.EMAIL_FROM;

function pendingNotification() {
  return {
    id: "notification_1",
    channel: "EMAIL",
    status: NotificationStatus.PENDING,
    recipient: "donor@example.test",
    subject: "Donation update",
    templateKey: "donation-refund-processed",
    payload: {
      referenceNumber: "AFD-2026-000001",
      refundAmount: "₹25",
      refundState: "partial refund",
    },
    attempts: 0,
    createdAt: new Date("2026-09-18T00:00:00.000Z"),
    updatedAt: new Date("2026-09-18T00:00:00.000Z"),
    scheduledFor: new Date("2026-09-18T00:00:00.000Z"),
  };
}

describe("notification worker flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Amaana Foundation <notifications@example.test>";

    mocks.findMany.mockResolvedValue([pendingNotification()]);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.update.mockResolvedValue({ id: "notification_1" });
    mocks.renderNotificationEmail.mockReturnValue({
      subject: "Donation refund processed",
      text: "Refund processed.",
      html: "<p>Refund processed.</p>",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  });

  it.each([
    ["missing ID", async () => ({ status: "ok" })],
    ["empty ID", async () => ({ id: "  " })],
    ["unreadable JSON", async () => { throw new SyntaxError("invalid JSON"); }],
  ])("retries a 2xx Resend response with %s instead of marking it SENT", async (_case, json) => {
    const sender = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    stubProvider( sender);

    expect(await processPendingEmailNotifications()).toEqual({
      selected: 1,
      sent: 0,
      failed: 1,
    });
    expect(mocks.updateMany).toHaveBeenLastCalledWith({
      where: { id: "notification_1", status: NotificationStatus.PROCESSING, attempts: 1 },
      data: {
        status: NotificationStatus.FAILED,
        failureReason: expect.stringMatching(/provider returned an (invalid|unreadable) receipt/),
        scheduledFor: expect.any(Date),
      },
    });
    expect(sender).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      headers: expect.objectContaining({
        "Idempotency-Key": "amaana-notification/notification_1",
      }),
    }));
  });

  it("atomically claims, sends idempotently and marks a queued email SENT", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "email_1" }),
    });
    stubProvider( fetchMock);

    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 1, sent: 1, failed: 0 });

    expect(mocks.updateMany).toHaveBeenNthCalledWith(3, {
      where: {
        id: "notification_1",
        status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
        attempts: { equals: 0, lt: 5 },
        scheduledFor: { lte: expect.any(Date) },
      },
      data: {
        status: NotificationStatus.PROCESSING,
        attempts: { increment: 1 },
        failureReason: null,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key",
          "Idempotency-Key": "amaana-notification/notification_1",
        }),
      }),
    );

    expect(mocks.updateMany).toHaveBeenNthCalledWith(4, {
      where: { id: "notification_1", status: NotificationStatus.PROCESSING, attempts: 1 },
      data: {
        status: NotificationStatus.SENT,
        sentAt: expect.any(Date),
        providerMessageId: "email_1",
        failureReason: null,
      },
    });
  });

  it("reschedules a transient provider failure instead of losing the notification", async () => {
    const before = Date.now();
    stubProvider( vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ name: "rate_limit_exceeded" }),
    }));

    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 1, sent: 0, failed: 1 });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(4, {
      where: { id: "notification_1", status: NotificationStatus.PROCESSING, attempts: 1 },
      data: {
        status: NotificationStatus.FAILED,
        failureReason: expect.stringMatching(/429/),
        scheduledFor: expect.any(Date),
      },
    });

    const failureUpdate = mocks.updateMany.mock.calls.at(-1)?.[0];
    expect(failureUpdate.data.scheduledFor.getTime()).toBeGreaterThanOrEqual(before + 5 * 60 * 1000);
  });

  it("does not persist unexpected internal error details in notification state", async () => {
    mocks.renderNotificationEmail.mockImplementationOnce(() => {
      throw new Error("template failed for donor@example.test with private payload");
    });

    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 1, sent: 0, failed: 1 });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(4, {
      where: { id: "notification_1", status: NotificationStatus.PROCESSING, attempts: 1 },
      data: {
        status: NotificationStatus.FAILED,
        failureReason: "Unexpected notification delivery failure",
        scheduledFor: expect.any(Date),
      },
    });
    expect(JSON.stringify(mocks.updateMany.mock.calls)).not.toContain("donor@example.test with private payload");
  });

  it("does not overwrite a newer worker state after provider acceptance", async () => {
    mocks.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    stubProvider( vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "email_1" }),
    }));

    const result = await processPendingEmailNotifications();
    expect(result).toEqual({ selected: 1, sent: 0, failed: 0 });
    expect(mocks.updateMany).toHaveBeenCalledTimes(4);
    expect(mocks.updateMany).toHaveBeenLastCalledWith({
      where: { id: "notification_1", status: NotificationStatus.PROCESSING, attempts: 1 },
      data: {
        status: NotificationStatus.SENT,
        sentAt: expect.any(Date),
        providerMessageId: "email_1",
        failureReason: null,
      },
    });
    const postClaimWrites = mocks.updateMany.mock.calls.slice(3);
    expect(postClaimWrites).toHaveLength(1);
    expect(postClaimWrites[0]?.[0]).toEqual(expect.objectContaining({
      data: expect.objectContaining({ status: NotificationStatus.SENT }),
    }));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("marks an exhausted stale processing attempt for manual review", async () => {
    mocks.findMany.mockResolvedValue([]);

    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 0, sent: 0, failed: 0 });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        channel: "EMAIL",
        status: NotificationStatus.PROCESSING,
        updatedAt: { lt: expect.any(Date) },
        attempts: { gte: 5 },
      },
      data: {
        status: NotificationStatus.FAILED,
        failureReason: expect.stringMatching(/manual review/i),
        scheduledFor: new Date("9999-12-31T23:59:59.999Z"),
      },
    });
  });

  it("skips delivery when another worker wins the atomic claim", async () => {
    mocks.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    const fetchMock = vi.fn();
    stubProvider( fetchMock);

    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 1, sent: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
