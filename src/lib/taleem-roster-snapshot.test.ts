import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), learner: vi.fn(), place: vi.fn(), assignment: vi.fn(), enrolment: vi.fn(), milestone: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    taleemLearner: { findMany: mocks.learner },
    taleemPlace: { findMany: mocks.place },
    taleemPlaceAssignment: { findMany: mocks.assignment },
    taleemEnrolment: { findMany: mocks.enrolment },
    taleemMilestone: { findMany: mocks.milestone },
  },
}));

import { loadRoster } from "./taleem-roster-service";

const day = new Date("2026-11-27T00:00:00Z");
const first = { id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic First", status: "ACTIVE" };
const second = { id: "l2", publicAlias: "TL-BCDEFGHJ", fullName: "Synthetic Second", status: "ACTIVE" };
const place = { id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED" };
const firstAssignment = { id: "a1", placeId: "p1", learnerId: "l1", startedOn: new Date("2026-01-01T00:00:00Z"), endedOn: null };
const nextAssignment = { id: "a2", placeId: "p1", learnerId: "l2", startedOn: day, endedOn: null };
type SyntheticRead = { read: (snapshot: number) => unknown[]; then: (resolve: (rows: unknown[]) => void) => void };

// Models a commit between independently executed statements. This is not a real PostgreSQL concurrency test.
let generation = 0;
function deferred(versions: [unknown[], unknown[]]): SyntheticRead {
  const read = (snapshot: number) => {
    const rows = versions[snapshot]!;
    generation = 1;
    return rows;
  };
  return { read, then: resolve => resolve(read(generation)) };
}

beforeEach(() => {
  vi.resetAllMocks();
  generation = 0;
  mocks.learner.mockImplementation(() => deferred([[first], [first, second]]));
  mocks.place.mockImplementation(() => deferred([[place], [place]]));
  mocks.assignment.mockImplementation(() => deferred([[firstAssignment], [{ ...firstAssignment, endedOn: new Date("2026-11-26T00:00:00Z") }, nextAssignment]]));
  mocks.enrolment.mockImplementation(() => deferred([[{ learnerId: "l1", programme: "QAIDA" }], [{ learnerId: "l2", programme: "HIFDH" }]]));
  mocks.milestone.mockImplementation(() => deferred([[], [{ learnerId: "l2", completedOn: day, supportAssociated: true, verifiedAt: day }]]));
  mocks.transaction.mockImplementation(async (reads: SyntheticRead[], options: { isolationLevel?: string }) => {
    if (options?.isolationLevel !== "RepeatableRead") return Promise.all(reads);
    const snapshot = generation;
    return reads.map(read => read.read(snapshot));
  });
});

describe("private Taleem roster snapshot", () => {
  it("keeps the holder, programme and aggregate counts in one snapshot even when a new assignment commits", async () => {
    const before = await loadRoster(day);
    expect(before.learners.map(learner => learner.publicAlias)).toEqual([first.publicAlias]);
    expect(before.learners[0]).toMatchObject({ programme: "QAIDA", placeCode: place.placeCode, assignmentId: "a1" });
    expect(before.places[0]).toMatchObject({ holderAlias: first.publicAlias, assignmentId: "a1" });
    expect(before.counts).toMatchObject({ occupiedPlaces: 1, vacantPlaces: 0, currentlySupportedStudents: 1, hifdhCompletionsAllTime: 0 });
    expect(mocks.transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Array), { isolationLevel: "RepeatableRead" });
    const after = await loadRoster(day);
    expect(after.places[0]).toMatchObject({ holderAlias: second.publicAlias, assignmentId: "a2" });
    expect(after.learners.find(learner => learner.id === second.id)).toMatchObject({ programme: "HIFDH", placeCode: place.placeCode, completionReview: { verified: true, supportAssociated: true } });
    expect(after.counts).toMatchObject({ occupiedPlaces: 1, vacantPlaces: 0, currentlySupportedStudents: 1, hifdhCompletionsAllTime: 1 });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });
  it("rejects an unavailable snapshot rather than falling back to independent reads", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("synthetic snapshot unavailable"));
    await expect(loadRoster(day)).rejects.toThrow("synthetic snapshot unavailable");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(generation).toBe(0);
  });
});
