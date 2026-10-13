import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationStatus } from "@prisma/client";

const db = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: db },
}));

import { processPendingEmailNotifications } from "./notifications";

describe("notification atomic retry eligibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.findMany.mockResolvedValue([{
      id: "queued-test",
      channel: "EMAIL",
      status: NotificationStatus.FAILED,
      attempts: 1,
      scheduledFor: new Date("2026-01-01T00:00:00.000Z"),
    }]);
    db.updateMany.mockResolvedValue({ count: 0 }).mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("checks due time again before claiming a retry selected earlier", async () => {
    const postponed = new Date(Date.now() + 300_000);
    db.updateMany.mockImplementationOnce(async (query) => ({
      count: query.where.scheduledFor?.lte < postponed ? 0 : 1,
    }));
    const result = await processPendingEmailNotifications();

    expect(result).toEqual({ selected: 1, sent: 0, failed: 0 });
    expect(db.updateMany).toHaveBeenCalledTimes(3);
    expect(db.updateMany.mock.calls[2]?.[0]).toEqual(expect.objectContaining({
      where: expect.objectContaining({
        id: "queued-test",
        scheduledFor: { lte: expect.any(Date) },
      }),
    }));
  });
  it("does not claim or send a retry after another attempt changes the selected version", async () => {
    vi.stubEnv("RESEND_API_KEY", "synthetic-key");
    vi.stubEnv("EMAIL_FROM", "notifications@example.test");
    const sender = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "synthetic-receipt" }) });
    vi.stubGlobal("fetch", sender);
    db.findMany.mockResolvedValueOnce([{
      id: "queued-test", channel: "EMAIL", status: NotificationStatus.FAILED,
      attempts: 1, scheduledFor: new Date(0), recipient: "donor@example.test",
      subject: "Synthetic message", templateKey: "donation-acknowledgement",
      payload: { referenceNumber: "AFD-SYNTHETIC", givingIntent: "GENERAL" },
    }]);
    // Another worker completed attempt2 and its due retry is already eligible.
    // Apply the real claim's attempt predicate to that newer database state.
    db.updateMany.mockImplementationOnce(async query => ({
      count: query.where.attempts.equals === 1 ? 0 : 1,
    }));

    expect(await processPendingEmailNotifications()).toEqual({ selected: 1, sent: 0, failed: 0 });
    expect(sender).not.toHaveBeenCalled();
    expect(db.updateMany.mock.calls[2]?.[0].where.attempts).toEqual({ equals: 1, lt: 5 });
    expect(db.updateMany).toHaveBeenCalledTimes(3);
  });

});
