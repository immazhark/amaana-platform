import { Prisma, type TaleemLearnerStatus, type TaleemPlaceStatus, type TaleemProgrammeKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import {
  newLearnerAlias, newPlaceCode, overlapsExisting, parseCalendarDate, rosterCounts, type RosterCounts,
} from "@/lib/taleem-roster-rules";

/** A refusal whose message is safe to show the operator. Anything else stays server-side. */
export class RosterError extends Error {}

const PROGRAMMES: readonly TaleemProgrammeKind[] = ["QAIDA", "NAZIRA", "HIFDH"];
const LEARNER_STATUSES: readonly TaleemLearnerStatus[] = ["ACTIVE", "ON_BREAK", "LEFT", "GRADUATED"];
const PLACE_STATUSES: readonly TaleemPlaceStatus[] = ["MAINTAINED", "SUSPENDED", "RETIRED"];
const DAY_MS = 24 * 60 * 60 * 1000;

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function requireDate(value: unknown, label: string): Date {
  const date = parseCalendarDate(value);
  if (!date) throw new RosterError(`${label} must be a real date (YYYY-MM-DD).`);
  return date;
}

// Audit events record WHAT happened and to which record, never a name or any private detail about a learner.
const audit = (tx: Prisma.TransactionClient, actorId: string, action: string, entityType: string, entityId: string, metadata: Prisma.InputJsonObject = {}) =>
  tx.auditEvent.create({ data: { actorId, action, entityType, entityId, metadata } });

export async function createLearner(input: { fullName: unknown; provenance?: unknown }, actorId: string) {
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  if (fullName.length < 1 || fullName.length > 200) throw new RosterError("Enter the learner's name (up to 200 characters).");
  const provenance = typeof input.provenance === "string" && input.provenance.trim() ? input.provenance.trim().slice(0, 300) : null;
  // A collision on a random alias is astronomically unlikely, but the unique constraint is the authority: retry with a new one.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await withSerializableTransactionRetry(async tx => {
        const learner = await tx.taleemLearner.create({ data: { publicAlias: newLearnerAlias(), fullName, provenance }, select: { id: true, publicAlias: true } });
        await audit(tx, actorId, "taleem.learner.create", "TaleemLearner", learner.id, { hasProvenance: provenance !== null });
        return learner;
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new RosterError("Could not create a unique reference; try again.");
}

export async function setLearnerStatus(learnerId: string, status: unknown, actorId: string) {
  if (!LEARNER_STATUSES.includes(status as TaleemLearnerStatus)) throw new RosterError("Choose a valid status.");
  return withSerializableTransactionRetry(async tx => {
    const changed = await tx.taleemLearner.updateMany({ where: { id: learnerId }, data: { status: status as TaleemLearnerStatus } });
    if (changed.count !== 1) throw new RosterError("That learner does not exist.");
    await audit(tx, actorId, "taleem.learner.status", "TaleemLearner", learnerId, { status: status as string });
  });
}

/** Moves a learner to a programme from a date. The earlier enrolment ends the day before, so history has no gap and no
 * overlap, and the learner stays one person. */
export async function startEnrolment(learnerId: string, programme: unknown, startedOn: unknown, actorId: string) {
  if (!PROGRAMMES.includes(programme as TaleemProgrammeKind)) throw new RosterError("Choose Qaida, Nazira or Hifdh.");
  const start = requireDate(startedOn, "The start date");
  return withSerializableTransactionRetry(async tx => {
    const learner = await tx.taleemLearner.findUnique({ where: { id: learnerId }, select: { id: true } });
    if (!learner) throw new RosterError("That learner does not exist.");
    const open = await tx.taleemEnrolment.findFirst({ where: { learnerId, endedOn: null }, select: { id: true, startedOn: true, programme: true } });
    if (open) {
      if (open.programme === programme) throw new RosterError("The learner is already on that programme.");
      const closeOn = new Date(start.getTime() - DAY_MS);
      if (closeOn < open.startedOn) throw new RosterError("The new programme must start after the current one began.");
      await tx.taleemEnrolment.update({ where: { id: open.id }, data: { endedOn: closeOn } });
    } else {
      const latest = await tx.taleemEnrolment.findFirst({ where: { learnerId }, orderBy: { startedOn: "desc" }, select: { endedOn: true } });
      if (latest?.endedOn && start <= latest.endedOn) throw new RosterError("That start date overlaps an earlier enrolment.");
    }
    const created = await tx.taleemEnrolment.create({ data: { learnerId, programme: programme as TaleemProgrammeKind, startedOn: start }, select: { id: true } });
    await audit(tx, actorId, "taleem.enrolment.start", "TaleemEnrolment", created.id, { learnerId, programme: programme as string });
    return created;
  });
}

export async function createPlace(input: { approvedOn?: unknown; note?: unknown }, actorId: string) {
  const approvedOn = input.approvedOn ? requireDate(input.approvedOn, "The approval date") : null;
  const note = typeof input.note === "string" && input.note.trim() ? input.note.trim().slice(0, 300) : null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await withSerializableTransactionRetry(async tx => {
        const place = await tx.taleemPlace.create({ data: { placeCode: newPlaceCode(), approvedOn, note }, select: { id: true, placeCode: true } });
        await audit(tx, actorId, "taleem.place.create", "TaleemPlace", place.id);
        return place;
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new RosterError("Could not create a unique place code; try again.");
}

export async function setPlaceStatus(placeId: string, status: unknown, actorId: string) {
  if (!PLACE_STATUSES.includes(status as TaleemPlaceStatus)) throw new RosterError("Choose a valid place status.");
  return withSerializableTransactionRetry(async tx => {
    if (status !== "MAINTAINED") {
      const holder = await tx.taleemPlaceAssignment.findFirst({ where: { placeId, endedOn: null }, select: { id: true } });
      if (holder) throw new RosterError("End the current assignment before suspending or retiring this place.");
    }
    const changed = await tx.taleemPlace.updateMany({ where: { id: placeId }, data: { status: status as TaleemPlaceStatus } });
    if (changed.count !== 1) throw new RosterError("That place does not exist.");
    await audit(tx, actorId, "taleem.place.status", "TaleemPlace", placeId, { status: status as string });
  });
}

/** Gives a place to a learner from a date. A place has one holder at a time and a learner holds one place at a time;
 * the database enforces that for open periods, and this also refuses a back-dated period that overlaps a closed one. */
export async function assignLearner(placeId: string, learnerId: string, startedOn: unknown, actorId: string) {
  const start = requireDate(startedOn, "The start date");
  try {
    return await withSerializableTransactionRetry(async tx => {
      const [place, learner] = await Promise.all([
        tx.taleemPlace.findUnique({ where: { id: placeId }, select: { id: true, status: true } }),
        tx.taleemLearner.findUnique({ where: { id: learnerId }, select: { id: true, status: true } }),
      ]);
      if (!place) throw new RosterError("That place does not exist.");
      if (!learner) throw new RosterError("That learner does not exist.");
      if (place.status !== "MAINTAINED") throw new RosterError("Only a maintained place can be assigned.");
      if (learner.status === "LEFT" || learner.status === "GRADUATED") throw new RosterError("Set the learner back to Active or On break before assigning a place.");
      const [forPlace, forLearner] = await Promise.all([
        tx.taleemPlaceAssignment.findMany({ where: { placeId }, select: { startedOn: true, endedOn: true } }),
        tx.taleemPlaceAssignment.findMany({ where: { learnerId }, select: { startedOn: true, endedOn: true } }),
      ]);
      if (overlapsExisting(start, null, forPlace)) throw new RosterError("This place already has an assignment on or after that date.");
      if (overlapsExisting(start, null, forLearner)) throw new RosterError("This learner already holds a place on or after that date.");
      const created = await tx.taleemPlaceAssignment.create({ data: { placeId, learnerId, startedOn: start }, select: { id: true } });
      await audit(tx, actorId, "taleem.assignment.start", "TaleemPlaceAssignment", created.id, { placeId, learnerId });
      return created;
    });
  } catch (error) {
    // The partial unique indexes are the last line of defence against two concurrent requests.
    if (isUniqueViolation(error)) throw new RosterError("That place or learner already has a current assignment.");
    throw error;
  }
}

export async function endAssignment(assignmentId: string, endedOn: unknown, reason: unknown, actorId: string) {
  const end = requireDate(endedOn, "The end date");
  const endReason = typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 300) : null;
  return withSerializableTransactionRetry(async tx => {
    const assignment = await tx.taleemPlaceAssignment.findUnique({ where: { id: assignmentId }, select: { id: true, startedOn: true, endedOn: true } });
    if (!assignment) throw new RosterError("That assignment does not exist.");
    if (assignment.endedOn) throw new RosterError("That assignment has already ended.");
    if (end < assignment.startedOn) throw new RosterError("The end date cannot be before the start date.");
    const changed = await tx.taleemPlaceAssignment.updateMany({ where: { id: assignmentId, endedOn: null }, data: { endedOn: end, endReason } });
    if (changed.count !== 1) throw new RosterError("That assignment changed; reload and try again.");
    await audit(tx, actorId, "taleem.assignment.end", "TaleemPlaceAssignment", assignmentId, { hasReason: endReason !== null });
  });
}

/** Records a Hifdh completion once per learner. It does not end anyone's support: an authorised operator decides the
 * transition separately, and the learner is never deleted. */
export async function recordHifdhCompletion(
  learnerId: string, completedOn: unknown, flags: { supportAssociated: boolean; verified: boolean }, actorId: string,
) {
  const date = requireDate(completedOn, "The completion date");
  try {
    return await withSerializableTransactionRetry(async tx => {
      const learner = await tx.taleemLearner.findUnique({ where: { id: learnerId }, select: { id: true } });
      if (!learner) throw new RosterError("That learner does not exist.");
      const created = await tx.taleemMilestone.create({
        data: { learnerId, kind: "HIFDH_COMPLETION", completedOn: date, supportAssociated: flags.supportAssociated, verifiedAt: flags.verified ? new Date() : null },
        select: { id: true },
      });
      await audit(tx, actorId, "taleem.milestone.record", "TaleemMilestone", created.id, { learnerId, verified: flags.verified, supportAssociated: flags.supportAssociated });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new RosterError("A Hifdh completion is already recorded for this learner.");
    throw error;
  }
}

export type RosterView = {
  counts: RosterCounts;
  learners: { id: string; publicAlias: string; fullName: string; status: TaleemLearnerStatus; programme: TaleemProgrammeKind | null; placeCode: string | null; assignmentId: string | null; openAssignmentPlaceCode: string | null; openAssignmentStartsOn: string | null; hasBlockingAssignment: boolean; completedHifdhOn: string | null }[];
  places: { id: string; placeCode: string; status: TaleemPlaceStatus; holderAlias: string | null; assignmentId: string | null; hasBlockingAssignment: boolean }[];
};

/** Everything the admin roster shows, as of a date. Private: names appear here and nowhere public. */
export async function loadRoster(asOf: Date = new Date()): Promise<RosterView> {
  const day = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const [learners, places, assignments, enrolments, milestones] = await Promise.all([
    prisma.taleemLearner.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, publicAlias: true, fullName: true, status: true } }),
    prisma.taleemPlace.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, placeCode: true, status: true } }),
    prisma.taleemPlaceAssignment.findMany({ select: { id: true, placeId: true, learnerId: true, startedOn: true, endedOn: true } }),
    prisma.taleemEnrolment.findMany({ where: { startedOn: { lte: day }, OR: [{ endedOn: null }, { endedOn: { gte: day } }] }, select: { learnerId: true, programme: true } }),
    prisma.taleemMilestone.findMany({ select: { learnerId: true, completedOn: true, supportAssociated: true, verifiedAt: true } }),
  ]);
  const counts = rosterCounts({
    places: places.map(place => ({ id: place.id, status: place.status })),
    assignments,
    milestones: milestones.map(milestone => ({ learnerId: milestone.learnerId, completedOn: milestone.completedOn, supportAssociated: milestone.supportAssociated, verified: milestone.verifiedAt !== null })),
  }, asOf);
  // Calendar-day occupancy is distinct from an open (editable) period. A future booking
  // must not appear as today's holder, but it must still block an overlapping new assignment.
  const currentByLearner = new Map<string, typeof assignments[number]>();
  const currentByPlace = new Map<string, typeof assignments[number]>();
  const openByLearner = new Map<string, typeof assignments[number]>();
  const openByPlace = new Map<string, typeof assignments[number]>();
  const blockedLearners = new Set<string>();
  const blockedPlaces = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.endedOn === null || assignment.endedOn >= day) {
      blockedLearners.add(assignment.learnerId);
      blockedPlaces.add(assignment.placeId);
      if (assignment.startedOn <= day) {
        currentByLearner.set(assignment.learnerId, assignment);
        currentByPlace.set(assignment.placeId, assignment);
      }
    }
    if (assignment.endedOn === null) {
      openByLearner.set(assignment.learnerId, assignment);
      openByPlace.set(assignment.placeId, assignment);
    }
  }
  const programmeOf = new Map(enrolments.map(enrolment => [enrolment.learnerId, enrolment.programme]));
  const placeById = new Map(places.map(place => [place.id, place]));
  const learnerById = new Map(learners.map(learner => [learner.id, learner]));
  const doneOn = new Map(milestones.map(milestone => [milestone.learnerId, milestone.completedOn.toISOString().slice(0, 10)]));
  return {
    counts,
    learners: learners.map(learner => {
      const held = currentByLearner.get(learner.id);
      const open = openByLearner.get(learner.id);
      return { ...learner, programme: programmeOf.get(learner.id) ?? null, placeCode: held ? placeById.get(held.placeId)?.placeCode ?? null : null,
        assignmentId: open?.id ?? null, openAssignmentPlaceCode: open ? placeById.get(open.placeId)?.placeCode ?? null : null,
        openAssignmentStartsOn: open?.startedOn.toISOString().slice(0, 10) ?? null, hasBlockingAssignment: blockedLearners.has(learner.id),
        completedHifdhOn: doneOn.get(learner.id) ?? null };
    }),
    places: places.map(place => {
      const held = currentByPlace.get(place.id);
      return { ...place, holderAlias: held ? learnerById.get(held.learnerId)?.publicAlias ?? null : null, assignmentId: openByPlace.get(place.id)?.id ?? null, hasBlockingAssignment: blockedPlaces.has(place.id) };
    }),
  };
}
