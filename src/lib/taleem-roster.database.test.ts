import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { historyPage, loadTaleemHistory } from "./taleem-roster-history";
import {
  RosterError, assignLearner, confirmHifdhEvidence, createLearner, createPlace, endAssignment, loadRoster, recordHifdhCompletion, setLearnerStatus, setPlaceStatus, startEnrolment,
} from "./taleem-roster-service";

// A real PostgreSQL test, deliberately unavailable to hosted and production DBs. Synthetic data only.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("Taleem roster PostgreSQL invariants", () => {
  const tag = "synthetic-roster-" + randomUUID().replaceAll("-", "");
  let actorId: string;
  let isolatedTargetAccepted = false;
  const learnerIds: string[] = [];
  const placeIds: string[] = [];

  const learner = async (name = "Synthetic Learner") => {
    const created = await createLearner({ fullName: name, provenance: tag }, actorId);
    learnerIds.push(created.id);
    return created;
  };
  const place = async () => {
    const created = await createPlace({ note: tag }, actorId);
    placeIds.push(created.id);
    return created;
  };
  const refused = async (promise: Promise<unknown>) => {
    try { await promise; } catch (error) { return error; }
    return null;
  };

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Taleem roster DB tests require the isolated loopback amaana database");
    }
    isolatedTargetAccepted = true;
    actorId = (await prisma.user.create({ data: { name: "Synthetic roster tester", email: tag + "@example.invalid", status: "ACTIVE" }, select: { id: true } })).id;
  });

  afterAll(async () => {
    if (!isolatedTargetAccepted) return;
    await prisma.taleemMilestone.deleteMany({ where: { learnerId: { in: learnerIds } } });
    await prisma.taleemPlaceAssignment.deleteMany({ where: { learnerId: { in: learnerIds } } });
    await prisma.taleemEnrolment.deleteMany({ where: { learnerId: { in: learnerIds } } });
    await prisma.taleemLearner.deleteMany({ where: { id: { in: learnerIds } } });
    await prisma.taleemPlace.deleteMany({ where: { id: { in: placeIds } } });
    await prisma.auditEvent.deleteMany({ where: { actorId } });
    await prisma.user.deleteMany({ where: { id: actorId } });
  });

  it("creates learners and places with opaque references and an audit event that holds no name", async () => {
    const created = await learner("Private Name Should Not Be Audited");
    const placed = await place();
    expect(created.publicAlias).toMatch(/^TL-[A-HJ-NP-Z2-9]{8}$/);
    expect(placed.placeCode).toMatch(/^TP-[A-HJ-NP-Z2-9]{6}$/);
    const events = await prisma.auditEvent.findMany({ where: { actorId, entityId: created.id } });
    expect(events.map(event => event.action)).toEqual(["taleem.learner.create"]);
    expect(JSON.stringify(events)).not.toContain("Private Name");
  });

  it("refuses a database-level malformed alias or blank name even when the application is bypassed", async () => {
    await expect(prisma.taleemLearner.create({ data: { publicAlias: "TL-00000001", fullName: "x", provenance: tag } })).rejects.toThrow();
    await expect(prisma.taleemLearner.create({ data: { publicAlias: "TL-ABCDEFGH", fullName: "   ", provenance: tag } })).rejects.toThrow();
    await expect(prisma.taleemPlace.create({ data: { placeCode: "TP-1234", note: tag } })).rejects.toThrow();
  });

  it("keeps one person through programme changes: the earlier enrolment closes the day before, with no gap or overlap", async () => {
    const person = await learner();
    await startEnrolment(person.id, "QAIDA", "2024-01-01", actorId);
    await startEnrolment(person.id, "NAZIRA", "2025-01-01", actorId);
    await startEnrolment(person.id, "HIFDH", "2026-01-01", actorId);
    const rows = await prisma.taleemEnrolment.findMany({ where: { learnerId: person.id }, orderBy: { startedOn: "asc" } });
    expect(rows.map(row => [row.programme, row.startedOn.toISOString().slice(0, 10), row.endedOn?.toISOString().slice(0, 10) ?? null])).toEqual([
      ["QAIDA", "2024-01-01", "2024-12-31"], ["NAZIRA", "2025-01-01", "2025-12-31"], ["HIFDH", "2026-01-01", null],
    ]);
    expect(await prisma.taleemLearner.count({ where: { provenance: tag, id: person.id } })).toBe(1);
  });

  it("reads bounded programme and place history for only the selected learner", async () => {
    const [person, other] = await Promise.all([learner(), learner()]);
    const [first, second] = await Promise.all([place(), place()]);
    await prisma.taleemEnrolment.createMany({ data: Array.from({ length: 26 }, (_, i) => ({
      learnerId: person.id, programme: i % 2 ? "NAZIRA" as const : "QAIDA" as const,
      startedOn: new Date(Date.UTC(2025, 0, i + 1)), endedOn: new Date(Date.UTC(2025, 0, i + 1)),
    })) });
    await startEnrolment(other.id, "HIFDH", "2026-01-01", actorId);
    const assignment = await assignLearner(first.id, person.id, "2025-01-01", actorId);
    await endAssignment(assignment.id, "2025-12-31", "PRIVATE_SYNTHETIC_REASON", actorId);
    await assignLearner(second.id, person.id, "2026-01-01", actorId);
    await assignLearner(first.id, other.id, "2026-01-01", actorId);
    const latest = await loadTaleemHistory(prisma, person.id, null, null);
    expect(latest).not.toBeNull();
    const programme = historyPage(latest!.enrolments);
    expect(programme.rows).toHaveLength(25);
    expect(programme.rows[0]?.startedOn.toISOString().slice(0, 10)).toBe("2025-01-26");
    expect(programme.older?.startedOn.toISOString().slice(0, 10)).toBe("2025-01-02");
    expect(latest!.assignments.map(row => row.place.placeCode)).toEqual([second.placeCode, first.placeCode]);
    expect(JSON.stringify(latest)).not.toContain("PRIVATE_SYNTHETIC_REASON");
    const older = await loadTaleemHistory(prisma, person.id, programme.older, latest!.assignments[0]!);
    expect(older?.enrolments.map(row => row.startedOn.toISOString().slice(0, 10))).toEqual(["2025-01-01"]);
    expect(older?.assignments.map(row => row.place.placeCode)).toEqual([first.placeCode]);
  });

  it("refuses the same programme twice and a programme that starts before the current one began", async () => {
    const person = await learner();
    await startEnrolment(person.id, "NAZIRA", "2026-03-01", actorId);
    expect(await refused(startEnrolment(person.id, "NAZIRA", "2026-06-01", actorId))).toBeInstanceOf(RosterError);
    expect(await refused(startEnrolment(person.id, "HIFDH", "2026-03-01", actorId))).toBeInstanceOf(RosterError);
  });

  it("gives a place to one learner at a time and a learner one place at a time", async () => {
    const [a, b] = [await learner(), await learner()];
    const [p1, p2] = [await place(), await place()];
    await assignLearner(p1.id, a.id, "2026-01-01", actorId);
    expect(await refused(assignLearner(p1.id, b.id, "2026-02-01", actorId))).toBeInstanceOf(RosterError);
    expect(await refused(assignLearner(p2.id, a.id, "2026-02-01", actorId))).toBeInstanceOf(RosterError);
    await assignLearner(p2.id, b.id, "2026-02-01", actorId);
  });

  it("lets two concurrent requests race for one place and gives it to exactly one", async () => {
    const [a, b] = [await learner(), await learner()];
    const p = await place();
    const results = await Promise.allSettled([assignLearner(p.id, a.id, "2026-04-01", actorId), assignLearner(p.id, b.id, "2026-04-01", actorId)]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.taleemPlaceAssignment.count({ where: { placeId: p.id, endedOn: null } })).toBe(1);
  });

  it("enforces the one-open-holder rule in the database itself, below the application", async () => {
    const [a, b] = [await learner(), await learner()];
    const p = await place();
    await prisma.taleemPlaceAssignment.create({ data: { placeId: p.id, learnerId: a.id, startedOn: new Date("2026-01-01T00:00:00Z") } });
    await expect(prisma.taleemPlaceAssignment.create({ data: { placeId: p.id, learnerId: b.id, startedOn: new Date("2026-02-01T00:00:00Z") } })).rejects.toThrow();
  });

  it("refuses a period that ends before it starts", async () => {
    const [a, p] = [await learner(), await place()];
    await expect(prisma.taleemPlaceAssignment.create({ data: { placeId: p.id, learnerId: a.id, startedOn: new Date("2026-05-02T00:00:00Z"), endedOn: new Date("2026-05-01T00:00:00Z") } })).rejects.toThrow();
  });

  it("frees a place when the assignment ends, keeps the history, and refuses an overlapping back-dated period", async () => {
    const [a, b] = [await learner(), await learner()];
    const p = await place();
    const first = await assignLearner(p.id, a.id, "2025-01-01", actorId);
    expect(await refused(endAssignment(first.id, "2024-12-31", "x", actorId))).toBeInstanceOf(RosterError);
    await endAssignment(first.id, "2025-12-31", "Left the madarsah", actorId);
    expect(await refused(endAssignment(first.id, "2026-01-05", null, actorId))).toBeInstanceOf(RosterError);
    expect(await refused(assignLearner(p.id, b.id, "2025-06-01", actorId))).toBeInstanceOf(RosterError);
    await assignLearner(p.id, b.id, "2026-01-01", actorId);
    expect(await prisma.taleemPlaceAssignment.count({ where: { placeId: p.id } })).toBe(2);
  });

  it("refuses to assign a suspended place or a learner who has left, and to suspend a place that is held", async () => {
    const [a, b] = [await learner(), await learner()];
    const [held, idle] = [await place(), await place()];
    await assignLearner(held.id, a.id, "2026-01-01", actorId);
    expect(await refused(setPlaceStatus(held.id, "SUSPENDED", actorId))).toBeInstanceOf(RosterError);
    await setPlaceStatus(idle.id, "SUSPENDED", actorId);
    expect(await refused(assignLearner(idle.id, b.id, "2026-02-01", actorId))).toBeInstanceOf(RosterError);
    await setPlaceStatus(idle.id, "MAINTAINED", actorId);
    await setLearnerStatus(b.id, "LEFT", actorId);
    expect(await refused(assignLearner(idle.id, b.id, "2026-02-01", actorId))).toBeInstanceOf(RosterError);
  });

  it("records one Hifdh completion per learner and never deletes or ends anything by itself", async () => {
    const [a, p] = [await learner(), await place()];
    await assignLearner(p.id, a.id, "2020-01-01", actorId);
    await recordHifdhCompletion(a.id, "2026-06-15", { supportAssociated: true, verified: true }, actorId);
    expect(await refused(recordHifdhCompletion(a.id, "2026-07-01", { supportAssociated: true, verified: true }, actorId))).toBeInstanceOf(RosterError);
    expect(await prisma.taleemMilestone.count({ where: { learnerId: a.id } })).toBe(1);
    expect(await prisma.taleemPlaceAssignment.count({ where: { learnerId: a.id, endedOn: null } })).toBe(1);
    expect(await prisma.taleemLearner.count({ where: { id: a.id } })).toBe(1);
  });

  it("confirms previously unresolved evidence once, preserving the recorded completion and assignment", async () => {
    const [a, p] = [await learner(), await place()];
    await assignLearner(p.id, a.id, "2020-01-01", actorId);
    const recorded = await recordHifdhCompletion(a.id, "2020-06-15", { supportAssociated: false, verified: false }, actorId);
    expect(await confirmHifdhEvidence(a.id, { verified: true, supportAssociated: false }, actorId)).toBe("confirmed");
    const first = await prisma.taleemMilestone.findUniqueOrThrow({ where: { id: recorded.id } });
    expect(first.verifiedAt).not.toBeNull();
    expect(first.supportAssociated).toBe(false);
    expect(await confirmHifdhEvidence(a.id, { verified: false, supportAssociated: true }, actorId)).toBe("confirmed");
    expect(await confirmHifdhEvidence(a.id, { verified: true, supportAssociated: true }, actorId)).toBe("unchanged");
    const after = await prisma.taleemMilestone.findUniqueOrThrow({ where: { id: recorded.id } });
    expect(after).toMatchObject({ completedOn: new Date("2020-06-15T00:00:00Z"), verifiedAt: first.verifiedAt, supportAssociated: true });
    const events = await prisma.auditEvent.findMany({ where: { actorId, entityId: recorded.id, action: "taleem.milestone.confirm" } });
    expect(events).toHaveLength(2);
    expect(await prisma.taleemPlaceAssignment.count({ where: { learnerId: a.id, endedOn: null } })).toBe(1);
    const roster = await loadRoster(new Date("2026-11-22T00:00:00Z"));
    expect(roster.learners.find(row => row.id === a.id)).toMatchObject({ completedHifdhOn: "2020-06-15", completionReview: { verified: true, supportAssociated: true } });
  });

  it("rejects missing, empty and future evidence confirmation without writing a milestone", async () => {
    const a = await learner();
    expect(await refused(confirmHifdhEvidence(a.id, { verified: true, supportAssociated: false }, actorId))).toBeInstanceOf(RosterError);
    const recorded = await recordHifdhCompletion(a.id, "2999-01-01", { supportAssociated: false, verified: false }, actorId);
    expect(await refused(confirmHifdhEvidence(a.id, { verified: true, supportAssociated: false }, actorId))).toBeInstanceOf(RosterError);
    expect(await refused(confirmHifdhEvidence(a.id, { verified: false, supportAssociated: false }, actorId))).toBeInstanceOf(RosterError);
    expect(await prisma.taleemMilestone.findUniqueOrThrow({ where: { id: recorded.id } })).toMatchObject({ verifiedAt: null, supportAssociated: false });
    expect(await prisma.auditEvent.count({ where: { actorId, entityId: recorded.id, action: "taleem.milestone.confirm" } })).toBe(0);
  });

  it("preserves both independent confirmations when two reviewers act concurrently", async () => {
    const a = await learner();
    const recorded = await recordHifdhCompletion(a.id, "2020-06-15", { supportAssociated: false, verified: false }, actorId);
    await Promise.all([confirmHifdhEvidence(a.id, { verified: true, supportAssociated: false }, actorId), confirmHifdhEvidence(a.id, { verified: false, supportAssociated: true }, actorId)]);
    const after = await prisma.taleemMilestone.findUniqueOrThrow({ where: { id: recorded.id } });
    expect(after.verifiedAt).not.toBeNull();
    expect(after.supportAssociated).toBe(true);
  });

  it("refuses to delete a learner who has history", async () => {
    const a = await learner();
    await startEnrolment(a.id, "QAIDA", "2026-01-01", actorId);
    await expect(prisma.taleemLearner.delete({ where: { id: a.id } })).rejects.toThrow();
  });

  it("shows the current calendar-day holder and programme while retaining future reservations", async () => {
    const [a, b, c] = [await learner(), await learner(), await learner()];
    const [p1, p2] = [await place(), await place()];
    const first = await assignLearner(p1.id, a.id, "2026-01-01", actorId);
    await endAssignment(first.id, "2026-11-26", null, actorId);
    const next = await assignLearner(p1.id, b.id, "2026-11-27", actorId);
    const future = await assignLearner(p2.id, c.id, "2026-12-01", actorId);
    await endAssignment(future.id, "2026-12-31", null, actorId);
    await startEnrolment(a.id, "QAIDA", "2026-01-01", actorId);
    await startEnrolment(a.id, "NAZIRA", "2026-11-27", actorId);

    const today = await loadRoster(new Date("2026-11-26T00:00:00Z"));
    expect(today.places.find(row => row.id === p1.id)).toMatchObject({ holderAlias: a.publicAlias, assignmentId: next.id, hasBlockingAssignment: true });
    expect(today.places.find(row => row.id === p2.id)).toMatchObject({ holderAlias: null, assignmentId: null, hasBlockingAssignment: true });
    expect(today.learners.find(row => row.id === a.id)).toMatchObject({ programme: "QAIDA", placeCode: p1.placeCode, assignmentId: null, hasBlockingAssignment: true });
    expect(today.learners.find(row => row.id === b.id)).toMatchObject({ placeCode: null, assignmentId: next.id, openAssignmentPlaceCode: p1.placeCode, openAssignmentStartsOn: "2026-11-27", hasBlockingAssignment: true });
    expect(today.learners.find(row => row.id === c.id)).toMatchObject({ placeCode: null, assignmentId: null, hasBlockingAssignment: true });

    const tomorrow = await loadRoster(new Date("2026-11-27T00:00:00Z"));
    expect(tomorrow.places.find(row => row.id === p1.id)).toMatchObject({ holderAlias: b.publicAlias, assignmentId: next.id });
    expect(tomorrow.learners.find(row => row.id === a.id)).toMatchObject({ programme: "NAZIRA", placeCode: null, assignmentId: null, hasBlockingAssignment: false });
    expect(tomorrow.learners.find(row => row.id === b.id)).toMatchObject({ placeCode: p1.placeCode, assignmentId: next.id });
  });

  it("reports separate counts that agree with the records", async () => {
    const roster = await loadRoster(new Date("2026-11-22T00:00:00Z"));
    const mine = roster.learners.filter(item => learnerIds.includes(item.id));
    expect(mine.length).toBe(learnerIds.length);
    expect(roster.counts.maintainedPlaces).toBeGreaterThanOrEqual(roster.counts.occupiedPlaces);
    expect(roster.counts.maintainedPlaces - roster.counts.occupiedPlaces).toBe(roster.counts.vacantPlaces);
    expect(roster.counts.studentsSupportedSinceInception).toBeGreaterThanOrEqual(roster.counts.currentlySupportedStudents);
  });
});
