import { describe, expect, it, vi } from "vitest";
import { historyBoundary, historyHref, historyPage, historyPeriodState, loadTaleemHistory, selectHistoryLearner } from "./taleem-roster-history";

const day = (value: string) => new Date(value + "T00:00:00.000Z");
const learner = { id: "synthetic", publicAlias: "TL-ABCDEFGH" };
const filters = { programme: "HIFDH", status: "ALL", placement: "CURRENT" } as const;

describe("Taleem private history", () => {
  it("accepts known opaque aliases only", () => {
    expect(selectHistoryLearner([learner], learner.publicAlias)).toBe(learner);
    for (const value of [undefined, learner.id, [learner.publicAlias], "PRIVATE_SYNTHETIC"]) expect(selectHistoryLearner([learner], value)).toBeUndefined();
  });
  it("refuses malformed calendar and identifier boundaries", () => {
    expect(historyBoundary("2026-11-27~p1")).toEqual({ startedOn: day("2026-11-27"), id: "p1" });
    for (const value of ["2026-02-30~p1", "2026-11-27~../private", "2026-11-27~a@b", "2026-11-27~"+"x".repeat(81), ["2026-11-27~p1"], undefined]) expect(historyBoundary(value)).toBeNull();
  });
  it("uses only bounded nested projections for the selected learner", async () => {
    const findUnique = vi.fn(async () => ({ enrolments: [], assignments: [] }));
    const boundary = historyBoundary("2026-11-27~p1")!;
    await loadTaleemHistory({ taleemLearner: { findUnique } } as never, learner.id, boundary, null);
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({ where: { id: learner.id }, select: {
      enrolments: { where: { OR: [{ startedOn: { lt: boundary.startedOn } }, { startedOn: boundary.startedOn, id: { lt: boundary.id } }] }, orderBy: [{ startedOn: "desc" }, { id: "desc" }], take: 26, select: { id: true, programme: true, startedOn: true, endedOn: true } },
      assignments: { orderBy: [{ startedOn: "desc" }, { id: "desc" }], take: 26, select: { id: true, startedOn: true, endedOn: true, place: { select: { placeCode: true } } } },
    } });
  });
  it("uses the last displayed record rather than the sentinel", () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({ id: "p"+i, startedOn: day("2026-01-01") }));
    expect(historyPage(rows)).toEqual({ rows: rows.slice(0, 25), older: rows[24] });
    expect(historyPage(rows.slice(0, 25)).older).toBeNull();
    expect(historyPage([])).toEqual({ rows: [], older: null });
  });
  it("distinguishes future, current inclusive end, and ended periods", () => {
    const today = day("2026-11-27");
    expect(historyPeriodState({ startedOn: day("2026-11-28"), endedOn: null }, today)).toBe("Scheduled");
    expect(historyPeriodState({ startedOn: day("2026-11-01"), endedOn: today }, today)).toBe("Current on date");
    expect(historyPeriodState({ startedOn: day("2026-11-01"), endedOn: day("2026-11-26") }, today)).toBe("Ended");
  });
  it("preserves normalized filters and independent boundaries", () => {
    expect(historyHref(filters, learner.publicAlias, { startedOn: day("2026-11-27"), id: "p1" }, { startedOn: day("2026-10-01"), id: "a1" })).toBe("/admin/taleem?programmeFilter=HIFDH&placementFilter=CURRENT&historyLearner=TL-ABCDEFGH&programmeBefore=2026-11-27%7Ep1&assignmentBefore=2026-10-01%7Ea1#learner-history-heading");
    expect(historyHref(filters)).toBe("/admin/taleem?programmeFilter=HIFDH&placementFilter=CURRENT#learners-heading");
  });
});
