import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { notification: db } }));
vi.mock("@/lib/notification-templates", () => ({
  renderNotificationEmail: () => ({
    subject: "Synthetic acknowledgement",
    text: "Synthetic message",
    html: "<p>Synthetic message</p>",
  }),
}));

import { processPendingEmailNotifications } from "./notifications";

const saved = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
};

describe("notification provider transport deadline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.RESEND_API_KEY = "re_synthetic";
    process.env.EMAIL_FROM = "Synthetic <test@example.test>";
    db.findMany.mockResolvedValue([{
      id: "queued-timeout",
      recipient: "recipient@example.test",
      subject: "Synthetic acknowledgement",
      templateKey: "donation-acknowledgement",
      payload: {},
      attempts: 0,
    }]);
    db.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const key of ["RESEND_API_KEY", "EMAIL_FROM"] as const) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("rejects oversized 2xx provider receipts without recording email as SENT", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "email_valid", ignored: "x".repeat(20_000),
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(processPendingEmailNotifications()).resolves.toEqual({
      selected: 1, sent: 0, failed: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      redirect: "error",
      headers: expect.objectContaining({ "Idempotency-Key": "amaana-notification/queued-timeout" }),
    }));
    expect(db.updateMany).toHaveBeenLastCalledWith({
      where: { id: "queued-timeout", status: "PROCESSING", attempts: 1 },
      data: {
        status: "FAILED",
        failureReason: expect.stringMatching(/unreadable receipt/),
        scheduledFor: expect.any(Date),
      },
    });
  });

  it("rejects oversized 429 error bodies while retaining status-based retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ name: "rate_limit_exceeded", details: "x".repeat(20_000) }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(processPendingEmailNotifications()).resolves.toEqual({
      selected: 1, sent: 0, failed: 1,
    });
    expect(db.updateMany).toHaveBeenLastCalledWith({
      where: { id: "queued-timeout", status: "PROCESSING", attempts: 1 },
      data: {
        status: "FAILED",
        failureReason: "Email provider returned 429",
        scheduledFor: expect.any(Date),
      },
    });
  });

  it("aborts an unresponsive Resend request and schedules retry", async () => {
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const sender = vi.fn().mockImplementation((_url: string, options: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      }),
    );
    vi.stubGlobal("fetch", sender);

    const work = processPendingEmailNotifications();
    await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
    expect(timeout).toHaveBeenCalledWith(15_000);
    controller.abort();

    expect(await work).toEqual({ selected: 1, sent: 0, failed: 1 });
    expect(db.updateMany).toHaveBeenLastCalledWith({
      where: { id: "queued-timeout", status: "PROCESSING", attempts: 1 },
      data: {
        status: "FAILED",
        failureReason: "Unexpected notification delivery failure",
        scheduledFor: expect.any(Date),
      },
    });
  });
});
