import { describe, expect, it } from "vitest";
import {
  LEARNER_ALIAS_PATTERN, PLACE_CODE_PATTERN, newLearnerAlias, newPlaceCode, overlapsExisting, parseCalendarDate, rosterCounts,
} from "./taleem-roster-rules";

const d = (value: string) => new Date(`${value}T00:00:00.000Z`);
const places = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `p${index + 1}`, status: "MAINTAINED" as const }));
const hold = (placeId: string, learnerId: string, from: string, to: string | null = null) => ({ placeId, learnerId, startedOn: d(from), endedOn: to ? d(to) : null });

describe("opaque references", () => {
  it("generates learner aliases and place codes in the shape the database enforces", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(newLearnerAlias()).toMatch(LEARNER_ALIAS_PATTERN);
      expect(newPlaceCode()).toMatch(PLACE_CODE_PATTERN);
    }
  });

  it("does not repeat or run in sequence", () => {
    const aliases = new Set(Array.from({ length: 500 }, newLearnerAlias));
    expect(aliases.size).toBe(500);
    expect(newLearnerAlias()).not.toBe(newLearnerAlias());
  });

  it("uses no look-alike characters", () => {
    for (let index = 0; index < 300; index += 1) expect(newLearnerAlias().slice(3)).not.toMatch(/[IO01]/);
  });

  it("rejects database ids, sequential values and wrong shapes", () => {
    for (const bad of ["TL-00000001", "TL-ABCDEFG", "TL-ABCDEFGHJ", "tl-ABCDEFGH", "ckx1234567", "TL-ABCDEFG1", "TL-ABCDEFGI", ""]) expect(bad).not.toMatch(LEARNER_ALIAS_PATTERN);
  });
});

describe("parseCalendarDate", () => {
  it("accepts real calendar days only", () => {
    expect(parseCalendarDate("2026-11-22")?.toISOString()).toBe("2026-11-22T00:00:00.000Z");
    expect(parseCalendarDate("2028-02-29")).not.toBeNull();
    for (const bad of ["2026-02-30", "2027-02-29", "2026-13-01", "22-11-2026", "2026-11-22T00:00:00Z", "", undefined, 20261122, null]) expect(parseCalendarDate(bad), String(bad)).toBeNull();
  });
});

describe("rosterCounts", () => {
  const asOf = d("2026-11-22");

  it("keeps maintained places, occupancy and supported students as separate numbers", () => {
    const counts = rosterCounts({ places: places(26), assignments: [hold("p1", "a", "2025-01-01"), hold("p2", "b", "2025-01-01")], milestones: [] }, asOf);
    expect(counts).toMatchObject({ maintainedPlaces: 26, occupiedPlaces: 2, vacantPlaces: 24, currentlySupportedStudents: 2 });
  });

  it("shows a vacancy, not a false active count, while a departed student's place awaits a replacement", () => {
    const departed = hold("p1", "a", "2025-01-01", "2026-10-31");
    const counts = rosterCounts({ places: places(26), assignments: [departed, ...Array.from({ length: 25 }, (_, index) => hold(`p${index + 2}`, `l${index}`, "2025-01-01"))], milestones: [] }, asOf);
    expect(counts.maintainedPlaces).toBe(26);
    expect(counts.occupiedPlaces).toBe(25);
    expect(counts.vacantPlaces).toBe(1);
    expect(counts.currentlySupportedStudents).toBe(25);
  });

  it("returns to 26 only when the admissions actually happen", () => {
    const assignments = [
      hold("p1", "a", "2025-01-01", "2026-10-31"), hold("p1", "z", "2026-11-10"),
      ...Array.from({ length: 25 }, (_, index) => hold(`p${index + 2}`, `l${index}`, "2025-01-01")),
    ];
    expect(rosterCounts({ places: places(26), assignments, milestones: [] }, asOf)).toMatchObject({ occupiedPlaces: 26, vacantPlaces: 0, currentlySupportedStudents: 26 });
    expect(rosterCounts({ places: places(26), assignments, milestones: [] }, d("2026-11-05"))).toMatchObject({ occupiedPlaces: 25, vacantPlaces: 1 });
  });

  it("counts one person once however often they change programme, place or return", () => {
    const assignments = [hold("p1", "a", "2023-01-01", "2024-06-30"), hold("p2", "a", "2024-09-01", "2025-05-31"), hold("p3", "a", "2026-01-01")];
    const counts = rosterCounts({ places: places(3), assignments, milestones: [] }, asOf);
    expect(counts.studentsSupportedSinceInception).toBe(1);
    expect(counts.currentlySupportedStudents).toBe(1);
  });

  it("counts a graduate in the history and not as currently supported once the assignment is closed", () => {
    const counts = rosterCounts({ places: places(2), assignments: [hold("p1", "g", "2020-01-01", "2026-06-30")], milestones: [] }, asOf);
    expect(counts.studentsSupportedSinceInception).toBe(1);
    expect(counts.currentlySupportedStudents).toBe(0);
  });

  it("does not count a suspended or retired place as maintained, and does not count its holder as occupying one", () => {
    const counts = rosterCounts({
      places: [{ id: "p1", status: "MAINTAINED" }, { id: "p2", status: "SUSPENDED" }, { id: "p3", status: "RETIRED" }],
      assignments: [hold("p1", "a", "2025-01-01"), hold("p2", "b", "2025-01-01")], milestones: [],
    }, asOf);
    expect(counts).toMatchObject({ maintainedPlaces: 1, occupiedPlaces: 1, vacantPlaces: 0, currentlySupportedStudents: 2 });
  });

  it("counts only verified Hifdh completions with confirmed Amaana support, and each learner once", () => {
    const m = (learnerId: string, completedOn: string, over: Partial<{ supportAssociated: boolean; verified: boolean }> = {}) =>
      ({ learnerId, completedOn: d(completedOn), supportAssociated: true, verified: true, ...over });
    const counts = rosterCounts({ places: [], assignments: [], milestones: [
      m("a", "2026-03-01"), m("b", "2026-05-01"), m("c", "2026-07-01"), m("d", "2026-09-01"),
      m("e", "2026-09-02", { verified: false }), m("f", "2026-09-03", { supportAssociated: false }), m("g", "2025-04-01"), m("a", "2026-03-01"),
    ] }, asOf);
    expect(counts.hifdhCompletionsInYear).toBe(4);
    expect(counts.hifdhCompletionsAllTime).toBe(5);
  });

  it("returns every figure as a separate field so they cannot be summed by accident into one claim", () => {
    const counts = rosterCounts({ places: places(26), assignments: [hold("p1", "a", "2025-01-01")], milestones: [] }, asOf);
    expect(Object.keys(counts).sort()).toEqual(["asOf", "currentlySupportedStudents", "hifdhCompletionsAllTime", "hifdhCompletionsInYear", "maintainedPlaces", "occupiedPlaces", "studentsSupportedSinceInception", "vacantPlaces"]);
  });
});

describe("overlapsExisting", () => {
  const closed = [{ startedOn: d("2025-01-01"), endedOn: d("2025-12-31") }];
  it("detects a back-dated period that overlaps a closed one", () => {
    expect(overlapsExisting(d("2025-06-01"), null, closed)).toBe(true);
    expect(overlapsExisting(d("2024-06-01"), d("2025-01-01"), closed)).toBe(true);
    expect(overlapsExisting(d("2025-12-31"), null, closed)).toBe(true);
  });
  it("allows a period that starts the day after, or ends the day before", () => {
    expect(overlapsExisting(d("2026-01-01"), null, closed)).toBe(false);
    expect(overlapsExisting(d("2024-01-01"), d("2024-12-31"), closed)).toBe(false);
  });
  it("treats an open existing period as extending forever", () => {
    expect(overlapsExisting(d("2030-01-01"), null, [{ startedOn: d("2026-01-01"), endedOn: null }])).toBe(true);
  });
});
