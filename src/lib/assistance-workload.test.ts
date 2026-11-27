import { describe, expect, it, vi } from "vitest";
import { assistanceWorkload, waitDays } from "./assistance-workload";

const now = new Date("2026-11-26T12:00:00Z");
const scope = { referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } };
const row = (status: string, assignedToId: string | null, count: number, date: string) => ({
  status, assignedToId, _count: { _all: count }, _min: { createdAt: new Date(date) },
});

describe("assistance workload", () => {
  it("counts whole days since receipt and never goes negative", () => {
    expect(waitDays(new Date("2026-11-22T13:00:00Z"), now)).toBe(3);
    expect(waitDays(new Date("2026-11-27T00:00:00Z"), now)).toBe(0);
  });

  it("groups current open stages, with personal and unassigned counts and no returned staff identities", async () => {
    const groupBy = vi.fn(async () => [
      row("SUBMITTED", "synthetic-reviewer", 2, "2026-11-20T12:00:00Z"),
      row("SUBMITTED", null, 3, "2026-11-18T12:00:00Z"),
      row("SUBMITTED", "synthetic-other", 1, "2026-11-21T12:00:00Z"),
      row("DOCUMENTS_REQUESTED", "synthetic-reviewer", 1, "2026-11-23T13:00:00Z"),
      row("UNDER_VERIFICATION", "synthetic-other", 2, "2026-11-25T12:00:00Z"),
      row("APPROVED", "synthetic-reviewer", 2, "2026-11-16T12:00:00Z"),
      row("APPROVED", "synthetic-other", 1, "2026-11-15T12:00:00Z"),
      row("CONVERTED_TO_APPEAL", null, 3, "2026-11-14T12:00:00Z"),
      row("CLOSED", null, 7, "2026-11-01T12:00:00Z"),
    ]);
    const result = await assistanceWorkload({ assistanceRequest: { groupBy } } as never, scope, "synthetic-reviewer", now);
    expect(groupBy).toHaveBeenCalledExactlyOnceWith({
      by: ["status", "assignedToId"],
      where: { ...scope, status: { in: ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED", "CONVERTED_TO_APPEAL"] } },
      _count: { _all: true }, _min: { createdAt: true },
    });
    expect(result).toEqual({
      submitted: 6, oldestSubmittedAgeDays: 8, openUnassigned: 3, openMine: 3, open: 9,
      stages: [
        { status: "SUBMITTED", total: { count: 6, oldestAgeDays: 8 }, mine: { count: 2, oldestAgeDays: 6 }, unassigned: { count: 3, oldestAgeDays: 8 } },
        { status: "DOCUMENTS_REQUESTED", total: { count: 1, oldestAgeDays: 2 }, mine: { count: 1, oldestAgeDays: 2 }, unassigned: { count: 0, oldestAgeDays: null } },
        { status: "UNDER_VERIFICATION", total: { count: 2, oldestAgeDays: 1 }, mine: { count: 0, oldestAgeDays: null }, unassigned: { count: 0, oldestAgeDays: null } },
      ],
      followUpStages: [
        { status: "APPROVED", total: { count: 3, oldestAgeDays: 11 }, mine: { count: 2, oldestAgeDays: 10 }, unassigned: { count: 0, oldestAgeDays: null } },
        { status: "CONVERTED_TO_APPEAL", total: { count: 3, oldestAgeDays: 12 }, mine: { count: 0, oldestAgeDays: null }, unassigned: { count: 3, oldestAgeDays: 12 } },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("synthetic-reviewer");
    expect(JSON.stringify(result)).not.toContain("synthetic-other");
  });

  it("shows all open stages with zero and no oldest age in an empty queue", async () => {
    const result = await assistanceWorkload({ assistanceRequest: { groupBy: async () => [] } } as never, scope, "synthetic-reviewer", now);
    expect(result).toMatchObject({ submitted: 0, oldestSubmittedAgeDays: null, openUnassigned: 0, openMine: 0, open: 0 });
    expect(result.stages).toHaveLength(3);
    expect(result.followUpStages).toHaveLength(2);
    for (const stage of [...result.stages, ...result.followUpStages]) {
      expect(stage.total).toEqual({ count: 0, oldestAgeDays: null });
      expect(stage.mine).toEqual({ count: 0, oldestAgeDays: null });
      expect(stage.unassigned).toEqual({ count: 0, oldestAgeDays: null });
    }
  });

  it("clamps future receipt timestamps to zero days", async () => {
    const result = await assistanceWorkload({ assistanceRequest: { groupBy: async () => [
      row("SUBMITTED", "synthetic-reviewer", 1, "2026-11-27T12:00:00Z"),
    ] } } as never, scope, "synthetic-reviewer", now);
    expect(result.oldestSubmittedAgeDays).toBe(0);
    expect(result.stages[0]?.mine.oldestAgeDays).toBe(0);
  });
});
