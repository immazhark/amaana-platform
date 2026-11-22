import { randomInt } from "node:crypto";

// Pure rules for the Taleem roster (brief v1.1 sections 6, 8 and 9). No database, no clock, no secrets: everything here
// is deterministic given its inputs, so the counting rules can be tested exhaustively.

// An alphabet without look-alikes (no I, O, 0 or 1). The database CHECK constraints mirror these shapes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LEARNER_ALIAS_PATTERN = /^TL-[A-HJ-NP-Z2-9]{8}$/;
export const PLACE_CODE_PATTERN = /^TP-[A-HJ-NP-Z2-9]{6}$/;

function opaque(prefix: string, length: number): string {
  let out = "";
  for (let index = 0; index < length; index += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${out}`;
}

/** A random public reference for a learner. It is not a database id, is not sequential and carries no meaning. */
export const newLearnerAlias = () => opaque("TL", 8);
/** A random reference for a sponsored place. Places, not learners, are what a sponsor commitment attaches to. */
export const newPlaceCode = () => opaque("TP", 6);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar date entered as YYYY-MM-DD, as a UTC-midnight Date; null when it is not a real calendar day. */
export function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export type PlaceStatus = "MAINTAINED" | "SUSPENDED" | "RETIRED";
export type RosterPlace = { id: string; status: PlaceStatus };
export type RosterAssignment = { placeId: string; learnerId: string; startedOn: Date; endedOn: Date | null };
export type RosterMilestone = { learnerId: string; completedOn: Date; supportAssociated: boolean; verified: boolean };

export type RosterCounts = {
  asOf: string;
  /** Approved ongoing places in the records (status MAINTAINED), whether or not a learner holds one today. */
  maintainedPlaces: number;
  /** Maintained places with a learner assigned on the date. */
  occupiedPlaces: number;
  /** Maintained places with nobody assigned on the date: shown as vacancies, never counted as supported students. */
  vacantPlaces: number;
  /** Distinct learners holding any place on the date. */
  currentlySupportedStudents: number;
  /** Distinct learners who have ever held a place, however many times the programme or place changed. */
  studentsSupportedSinceInception: number;
  /** Verified Hifdh completions with confirmed Amaana support association, in the calendar year of the date. */
  hifdhCompletionsInYear: number;
  /** The same, across all years. */
  hifdhCompletionsAllTime: number;
};

const covers = (assignment: RosterAssignment, day: number) =>
  assignment.startedOn.getTime() <= day && (assignment.endedOn === null || assignment.endedOn.getTime() >= day);

/**
 * The separate counts of brief section 6. They are deliberately separate numbers and must never be added together or
 * shown as one figure: places maintained is a commitment, supported students is what is true on a date, and the
 * milestones are verified history.
 */
export function rosterCounts(
  input: { places: RosterPlace[]; assignments: RosterAssignment[]; milestones: RosterMilestone[] },
  asOf: Date,
): RosterCounts {
  const day = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  const maintained = new Set(input.places.filter(place => place.status === "MAINTAINED").map(place => place.id));
  const current = input.assignments.filter(assignment => covers(assignment, day));
  const occupied = new Set(current.filter(assignment => maintained.has(assignment.placeId)).map(assignment => assignment.placeId));
  const counted = input.milestones.filter(milestone => milestone.verified && milestone.supportAssociated);
  const year = asOf.getUTCFullYear();
  return {
    asOf: new Date(day).toISOString().slice(0, 10),
    maintainedPlaces: maintained.size,
    occupiedPlaces: occupied.size,
    vacantPlaces: maintained.size - occupied.size,
    currentlySupportedStudents: new Set(current.map(assignment => assignment.learnerId)).size,
    studentsSupportedSinceInception: new Set(input.assignments.map(assignment => assignment.learnerId)).size,
    // One learner can complete Hifdh once: the database has a unique (learner, kind) guard; the Set mirrors it here.
    hifdhCompletionsInYear: new Set(counted.filter(milestone => milestone.completedOn.getUTCFullYear() === year).map(milestone => milestone.learnerId)).size,
    hifdhCompletionsAllTime: new Set(counted.map(milestone => milestone.learnerId)).size,
  };
}

/** Whether a new assignment period collides with an earlier, already-closed one for the same place or learner. The
 * database stops two OPEN periods; this stops a back-dated period from overlapping a closed one. */
export function overlapsExisting(
  start: Date,
  end: Date | null,
  existing: readonly { startedOn: Date; endedOn: Date | null }[],
): boolean {
  const newEnd = end === null ? Number.POSITIVE_INFINITY : end.getTime();
  return existing.some(period => {
    const periodEnd = period.endedOn === null ? Number.POSITIVE_INFINITY : period.endedOn.getTime();
    return start.getTime() <= periodEnd && period.startedOn.getTime() <= newEnd;
  });
}
