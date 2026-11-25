import { describe, expect, it, vi } from "vitest";
import { assistanceWorkload, waitDays } from "./assistance-workload";

describe("assistance workload", () => {
  it("counts whole days waited and never goes negative", () => {
    const now = new Date("2026-11-25T12:00:00Z");
    expect(waitDays(new Date("2026-11-22T13:00:00Z"), now)).toBe(2);
    expect(waitDays(new Date("2026-11-26T00:00:00Z"), now)).toBe(0);
  });

  it("derives the figures from the live scope, with the oldest waiting request first", async () => {
    const count = vi.fn(async ({ where }: { where: Record<string, unknown> }) => (where.status === "SUBMITTED" ? 4 : "assignedToId" in where ? 3 : 9));
    const findFirst = vi.fn(async (_args: { where: unknown; orderBy: unknown }) => ({ createdAt: new Date("2026-11-20T12:00:00Z") }));
    const result = await assistanceWorkload({ assistanceRequest: { count, findFirst } } as never, { id: { not: "x" } }, new Date("2026-11-25T12:00:00Z"));
    expect(result).toEqual({ awaitingFirstReview: 4, oldestWaitingDays: 5, openUnassigned: 3, open: 9 });
    expect(findFirst.mock.calls[0]![0].orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }]);
    expect(findFirst.mock.calls[0]![0].where).toMatchObject({ id: { not: "x" }, status: "SUBMITTED" });
  });

  it("reports no oldest age when nothing is waiting", async () => {
    const result = await assistanceWorkload({ assistanceRequest: { count: async () => 0, findFirst: async () => null } } as never, {});
    expect(result.oldestWaitingDays).toBeNull();
  });
});
