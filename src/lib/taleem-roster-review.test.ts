import { describe, expect, it } from "vitest";
import { filterRosterLearners, milestoneConfirmationPlan, rosterLearnerFilters, rosterReview } from "./taleem-roster-review";

const learner = (publicAlias: string, programme: string | null, placeCode: string | null, extra: Partial<Parameters<typeof rosterReview>[0][number]> = {}) =>
  ({ publicAlias, programme, placeCode, status: "ACTIVE", hasBlockingAssignment: placeCode !== null, completedHifdhOn: null, completionReview: null, ...extra });
const place = (placeCode: string, holderAlias: string | null, extra: Partial<Parameters<typeof rosterReview>[1][number]> = {}) =>
  ({ placeCode, holderAlias, status: "MAINTAINED", hasBlockingAssignment: holderAlias !== null, ...extra });

describe("private Taleem roster review", () => {
  it("separates the comparable learner cohort from maintained places and other programmes", () => {
    const review = rosterReview([learner("a", "NAZIRA", "p1"), learner("b", "HIFDH", "p2"), learner("c", "QAIDA", "p3"), learner("d", null, "p4")],
      [place("p1", "a"), place("p2", "b"), place("p3", "c"), place("p4", "d"), place("p5", null)]);
    expect(review.naziraHifdhStudents).toBe(2);
    expect(review.missingProgramme).toEqual(["d"]);
    expect(review.assignableVacancies).toEqual(["p5"]);
  });
  it("separates inactive holders, place conflicts, reserved vacancies and incomplete milestone evidence", () => {
    const review = rosterReview([learner("a", "HIFDH", "p1", { status: "GRADUATED", completedHifdhOn: "2026-06-01", completionReview: { verified: false, supportAssociated: true } }),
      learner("b", "NAZIRA", "p2"), learner("c", "QAIDA", null, { hasBlockingAssignment: true })],
      [place("p1", "a"), place("p2", "other", { status: "SUSPENDED" }), place("p3", null, { hasBlockingAssignment: true })]);
    expect(review.inactiveHolders).toEqual(["a"]);
    expect(review.placeConflicts).toEqual(["b"]);
    expect(review.reservedVacancies).toEqual(["p3"]);
    expect(review.assignableVacancies).toEqual([]);
    expect(review.pendingMilestones).toEqual(["a"]);
    expect(review.naziraHifdhStudents).toBe(1);
  });
  it("does not count absent or unsupported place records, or turn a vacancy into a sponsor", () => {
    expect(rosterReview([learner("a", "HIFDH", "missing"), learner("b", "NAZIRA", null)], [])).toMatchObject({ naziraHifdhStudents: 0, placeConflicts: ["a"], assignableVacancies: [] });
    expect(rosterReview([], [place("p", null, { status: "RETIRED" })]).assignableVacancies).toEqual([]);
  });
});

describe("Hifdh evidence confirmation", () => {
  const initial = { completedOn: "2026-06-01", verified: false, supportAssociated: true };
  it("preserves established evidence and never downgrades either flag", () => {
    expect(milestoneConfirmationPlan(initial, { verified: true, supportAssociated: false }, "2026-11-27")).toEqual({ kind: "update", verified: true, supportAssociated: true });
    expect(milestoneConfirmationPlan({ ...initial, verified: true, supportAssociated: false }, { verified: false, supportAssociated: true }, "2026-11-27")).toEqual({ kind: "update", verified: true, supportAssociated: true });
  });
  it("refuses empty and future confirmations and treats repeat confirmation as a no-op", () => {
    expect(milestoneConfirmationPlan(initial, { verified: false, supportAssociated: false }, "2026-11-27")).toEqual({ kind: "empty" });
    expect(milestoneConfirmationPlan({ ...initial, completedOn: "2026-11-28" }, { verified: true, supportAssociated: false }, "2026-11-27")).toEqual({ kind: "future" });
    expect(milestoneConfirmationPlan({ ...initial, verified: true }, { verified: true, supportAssociated: false }, "2026-11-27")).toEqual({ kind: "unchanged" });
  });
});

describe("private programme and status reconciliation", () => {
  it("partitions matched maintained places by current programme and learner status without changing the baseline comparison", () => {
    const review = rosterReview([
      learner("a", "QAIDA", "p1"), learner("b", "NAZIRA", "p2", { status: "ON_BREAK" }),
      learner("c", "HIFDH", "p3", { status: "GRADUATED" }), learner("d", null, "p4", { status: "LEFT" }),
      learner("e", "NAZIRA", null),
    ], [place("p1", "a"), place("p2", "b"), place("p3", "c"), place("p4", "d")]);
    expect(review.naziraHifdhStudents).toBe(2);
    expect(review.programmeStatus).toEqual([
      { programme: "QAIDA", active: 1, onBreak: 0, inactive: 0, unknownStatus: 0 },
      { programme: "NAZIRA", active: 0, onBreak: 1, inactive: 0, unknownStatus: 0 },
      { programme: "HIFDH", active: 0, onBreak: 0, inactive: 1, unknownStatus: 0 },
      { programme: "UNCLASSIFIED", active: 0, onBreak: 0, inactive: 1, unknownStatus: 0 },
    ]);
  });
  it("flags occupied maintained places without a matching reverse link and never counts them as vacancies", () => {
    const review = rosterReview([learner("a", "HIFDH", "p2"), learner("b", "NAZIRA", "p3")],
      [place("p1", "missing"), place("p2", "a"), place("p3", "a"), place("p4", null),
        place("p5", null, { hasBlockingAssignment: true }), place("p6", "missing", { status: "RETIRED" })]);
    expect(review.unmatchedOccupiedPlaces).toEqual(["p1", "p3"]);
    expect(review.placeConflicts).toEqual(["b"]);
    expect(review.assignableVacancies).toEqual(["p4"]);
    expect(review.reservedVacancies).toEqual(["p5"]);
    expect(review.naziraHifdhStudents).toBe(1);
  });
  it("shows unknown status and programme separately and excludes suspended places", () => {
    const review = rosterReview([learner("a", "UNKNOWN", "p1", { status: "UNKNOWN" }), learner("b", "HIFDH", "p2")],
      [place("p1", "a"), place("p2", "b", { status: "SUSPENDED" })]);
    expect(review.programmeStatus.at(-1)).toEqual({ programme: "UNCLASSIFIED", active: 0, onBreak: 0, inactive: 0, unknownStatus: 1 });
    expect(review.naziraHifdhStudents).toBe(0);
    expect(review.placeConflicts).toEqual(["b"]);
  });
});

describe("Taleem learner directory filters", () => {
  const records = [
    learner("current", "NAZIRA", "p1"),
    learner("reserved", "NAZIRA", null, { hasBlockingAssignment: true }),
    learner("vacant", "QAIDA", null),
    learner("completed", "HIFDH", null, { status: "GRADUATED" }),
    learner("unclassified", null, null, { status: "ON_BREAK" }),
  ];
  it("intersects programme, status and placement, preserving the original records and order", () => {
    expect(filterRosterLearners(records, rosterLearnerFilters({ programmeFilter: "NAZIRA", statusFilter: "ACTIVE", placementFilter: "RESERVED" }))).toEqual([records[1]]);
    expect(filterRosterLearners(records, rosterLearnerFilters({ programmeFilter: "NAZIRA" }))).toEqual(records.slice(0, 2));
    expect(records).toHaveLength(5);
  });
  it("distinguishes today's holder, future bookings, unassigned and unclassified learners", () => {
    expect(filterRosterLearners(records, rosterLearnerFilters({ placementFilter: "CURRENT" }))).toEqual([records[0]]);
    expect(filterRosterLearners(records, rosterLearnerFilters({ placementFilter: "UNASSIGNED" }))).toEqual(records.slice(2));
    expect(filterRosterLearners(records, rosterLearnerFilters({ programmeFilter: "UNCLASSIFIED", statusFilter: "ON_BREAK" }))).toEqual([records[4]]);
  });
  it("does not reflect arbitrary input, repeated values or partial matches", () => {
    const filters = rosterLearnerFilters({ programmeFilter: ["HIFDH", "QAIDA"], statusFilter: "PRIVATE_SYNTHETIC_NAME", placementFilter: "current" });
    expect(filters).toEqual({ programme: "ALL", status: "ALL", placement: "ALL" });
    expect(filterRosterLearners(records, filters)).toEqual(records);
    expect(filterRosterLearners(records, rosterLearnerFilters({ programmeFilter: "QAIDA", statusFilter: "GRADUATED" }))).toEqual([]);
  });
});
