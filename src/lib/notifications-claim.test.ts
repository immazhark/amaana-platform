import { beforeEach, describe, expect, it, vi } from "vitest";
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
    db.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
  });

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
});
