import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { rejectAssistanceRequest } from "./assistance-rejection-service";
import { capacityUsed, capacityYearBounds, countedCaseWhere } from "./assistance-capacity";
import { INDIVIDUAL_CASE_ANNUAL_CAPACITY } from "./assistance-policy";
import { loadAssistanceDecisionBreakdown, loadAssistanceDecisionReport } from "./assistance-decision-report";
import { AssistanceApprovalError, approveAssistanceRequest, saveApprovalDraft, type ApprovalInput } from "./assistance-approval-service";

// A real PostgreSQL test, deliberately unavailable to hosted and production DBs. Synthetic data only.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("assistance approval PostgreSQL invariants", () => {
  const tag = "synthetic-approve-" + randomUUID().replaceAll("-", "");
  let actorId = "";
  let otherActorId = "";
  let isolatedTargetAccepted = false;
  const requestIds: string[] = [];

  const fields: ApprovalInput["fields"] = {
    needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: 5000, approvedPublicTarget: null,
    paymentDestination: "Hospital billing desk", verificationSummary: "Checked the bills and the letter.", zakatStatus: "NOT_APPLICABLE",
    publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED",
    otherFundingNotes: "None found", confidentialityLevel: "CONFIDENTIAL",
  };
  const publicFields: ApprovalInput["fields"] = { ...fields, approvedPublicTarget: 4500, publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_APPLICABLE", medicalDetailsConsent: "ALLOWED", institutionNameConsent: "NOT_ALLOWED", archiveConsent: "ALLOWED" };

  async function makeRequest(over: { status?: "SUBMITTED" | "DOCUMENTS_REQUESTED" | "UNDER_VERIFICATION" | "APPROVED" | "REJECTED" | "CLOSED" | "CONVERTED_TO_APPEAL"; email?: string | null; appealId?: string } = {}) {
    const request = await prisma.assistanceRequest.create({
      data: {
        referenceNumber: "AF-TEST-" + randomUUID().slice(0, 8).toUpperCase(), applicantName: "Synthetic Applicant", phone: "9999999999", city: "Synthetic City",
        category: "MEDICAL", description: "Synthetic description for an approval test, long enough to be a realistic request.",
        consentGivenAt: new Date(), trackingTokenHash: tag, status: over.status ?? "UNDER_VERIFICATION",
        email: over.email === undefined ? tag + "@example.invalid" : over.email, appealId: over.appealId ?? null,
      },
    });
    requestIds.push(request.id);
    return request;
  }
  const input = async (requestId: string, over: Partial<ApprovalInput> = {}): Promise<ApprovalInput> => {
    const request = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: requestId }, select: { updatedAt: true, verification: { select: { updatedAt: true } } } });
    return { requestId, route: "APPROVED_PRIVATE", fields, expectedRequestUpdatedAt: request.updatedAt, expectedVerificationUpdatedAt: request.verification?.updatedAt ?? null, actorId, ...over };
  };
  const refused = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { return error as AssistanceApprovalError; } return null; };
  const counts = async (requestId: string) => ({
    audits: await prisma.auditEvent.count({ where: { entityType: "AssistanceRequest", entityId: requestId, action: "assistance.approved" } }),
    notifications: await prisma.notification.count({ where: { assistanceRequestId: requestId } }),
  });

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") throw new Error("Assistance approval DB tests require the isolated loopback amaana database");
    isolatedTargetAccepted = true;
    actorId = (await prisma.user.create({ data: { name: "Synthetic approver", email: tag + "-a@example.invalid", status: "ACTIVE" }, select: { id: true } })).id;
    otherActorId = (await prisma.user.create({ data: { name: "Synthetic other", email: tag + "-b@example.invalid", status: "ACTIVE" }, select: { id: true } })).id;
  });

  // Capacity is global to the year, so every test starts with none of this file's cases counted.
  beforeEach(async () => {
    if (isolatedTargetAccepted) await prisma.assistanceRequest.updateMany({ where: { id: { in: requestIds } }, data: { acceptedAt: null } });
  });

  afterAll(async () => {
    if (!isolatedTargetAccepted) return;
    await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS "synthetic_approve_fail" ON "AuditEvent"');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS "synthetic_approve_fail"()');
    await prisma.notification.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorId: { in: [actorId, otherActorId] } }, { entityId: { in: requestIds } }] } });
    await prisma.assistanceRejection.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.assistanceVerification.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.assistanceRequest.deleteMany({ where: { id: { in: requestIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [actorId, otherActorId] } } });
  });

  it("17. records the completed verification and the approved status together, for each route", async () => {
    for (const [route, f] of [["APPROVED_PRIVATE", fields], ["APPROVED_PARTIAL", fields], ["APPROVED_PUBLIC", publicFields]] as const) {
      const request = await makeRequest();
      const result = await approveAssistanceRequest(await input(request.id, { route, fields: f }));
      expect(result).toMatchObject({ outcome: "approved", status: "APPROVED", route });
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
      expect(after.status, route).toBe("APPROVED");
      expect(after.verification, route).toMatchObject({ decision: route, needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, reviewedById: actorId, paymentDestination: "Hospital billing desk" });
      expect(after.verification!.completedAt).not.toBeNull();
      expect(after.appealId).toBeNull();
      expect(await counts(request.id)).toEqual({ audits: 1, notifications: 1 });
    }
  });

  it("14. private and partial approval store no public target and need no public content", async () => {
    const request = await makeRequest();
    await approveAssistanceRequest(await input(request.id, { route: "APPROVED_PRIVATE" }));
    const verification = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
    expect(verification.approvedPublicTarget).toBeNull();
    expect(verification).toMatchObject({ publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED" });
  });

  it("15 and 16. refuses an incomplete or inconsistent approval with every field error and no mutation", async () => {
    const request = await makeRequest();
    const bad = { ...publicFields, needConfirmed: false, evidenceReviewed: false, verificationSummary: "", approvedPublicTarget: 9999, publicNameConsent: "UNCONFIRMED" };
    const error = await refused(approveAssistanceRequest(await input(request.id, { route: "APPROVED_PUBLIC", fields: bad })));
    expect(error).toBeInstanceOf(AssistanceApprovalError);
    expect(error!.code).toBe("incomplete");
    expect(Object.keys(error!.fieldErrors ?? {}).sort()).toEqual(["approvedPublicTarget_exceeds", "evidenceReviewed", "needConfirmed", "publicNameConsent", "verificationSummary"]);
    const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
    expect(after.status).toBe("UNDER_VERIFICATION");
    expect(after.verification).toBeNull();
    expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
  });

  it("17. rolls the whole approval back when a later step fails: no status change, no verification, no event, no email", async () => {
    const request = await makeRequest();
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION "synthetic_approve_fail"() RETURNS trigger AS $$ BEGIN IF NEW."entityId" = '${request.id}' AND NEW."action" = 'assistance.approved' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER "synthetic_approve_fail" BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION "synthetic_approve_fail"()');
    try {
      expect(await refused(approveAssistanceRequest(await input(request.id)))).not.toBeNull();
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
      expect(after.status).toBe("UNDER_VERIFICATION");
      expect(after.verification).toBeNull();
      expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS "synthetic_approve_fail" ON "AuditEvent"');
    }
  });

  it("refuses a stale request or verification version without overwriting", async () => {
    const request = await makeRequest();
    const stale = await input(request.id);
    await prisma.assistanceRequest.update({ where: { id: request.id }, data: { internalNotes: "Changed by another reviewer" } });
    expect((await refused(approveAssistanceRequest(stale)))!.code).toBe("stale_request");
    const withVerification = await makeRequest();
    const row = await prisma.assistanceVerification.create({ data: { assistanceRequestId: withVerification.id } });
    const staleVerification = await input(withVerification.id);
    await prisma.assistanceVerification.update({ where: { id: row.id }, data: { verificationSummary: "Edited after the page loaded" } });
    expect((await refused(approveAssistanceRequest(staleVerification)))!.code).toBe("stale_verification");
    expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: withVerification.id } })).status).toBe("UNDER_VERIFICATION");
    expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
  });

  it("keeps existing partial work: it replaces only what the approval states, on the same verification record", async () => {
    const request = await makeRequest();
    const saved = await prisma.assistanceVerification.create({ data: { assistanceRequestId: request.id, verificationSummary: "Saved progress", otherFundingNotes: "Earlier note" } });
    await approveAssistanceRequest(await input(request.id));
    const after = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
    expect(after.id).toBe(saved.id);
    expect(after.verificationSummary).toBe("Checked the bills and the letter.");
  });

  it("refuses a request with a linked appeal, a rejected one and a closed one, each with its own guidance", async () => {
    expect((await refused(approveAssistanceRequest(await input((await makeRequest({ status: "CONVERTED_TO_APPEAL" })).id))))!.code).toBe("linked_appeal");
    expect((await refused(approveAssistanceRequest(await input((await makeRequest({ status: "REJECTED" })).id))))!.code).toBe("rejected");
    expect((await refused(approveAssistanceRequest(await input((await makeRequest({ status: "CLOSED" })).id))))!.code).toBe("closed");
    expect((await refused(approveAssistanceRequest({ ...(await input((await makeRequest()).id)), requestId: "missing" })))!.code).toBe("not_found");
  });

  it("is safe to repeat: an already approved request returns the original decision and writes nothing", async () => {
    const request = await makeRequest();
    const first = await input(request.id);
    const original = await approveAssistanceRequest(first);
    const repeat = await approveAssistanceRequest({ ...first, route: "APPROVED_PUBLIC", fields: publicFields, actorId: otherActorId });
    expect(repeat.outcome).toBe("already_approved");
    expect(repeat.route).toBe("APPROVED_PRIVATE");
    expect(repeat.approvedAt?.getTime()).toBe(original.approvedAt?.getTime());
    expect(await counts(request.id)).toEqual({ audits: 1, notifications: 1 });
  });

  it("makes concurrent submissions one coherent approval", async () => {
    const request = await makeRequest();
    const base = await input(request.id);
    const results = await Promise.allSettled([approveAssistanceRequest(base), approveAssistanceRequest({ ...base, actorId: otherActorId }), approveAssistanceRequest(base)]);
    for (const result of results) expect(result.status, JSON.stringify(result)).toBe("fulfilled");
    const outcomes = results.map(result => (result as PromiseFulfilledResult<{ outcome: string }>).value.outcome);
    expect(outcomes.filter(outcome => outcome === "approved")).toHaveLength(1);
    expect(await counts(request.id)).toEqual({ audits: 1, notifications: 1 });
  });

  it("never leaves a request both approved and rejected when the two decisions race", async () => {
    for (let round = 0; round < 4; round += 1) {
      const request = await makeRequest();
      const params = await input(request.id);
      await Promise.allSettled([
        approveAssistanceRequest(params),
        rejectAssistanceRequest({ requestId: request.id, reason: "Rejected in a race", expectedRequestUpdatedAt: params.expectedRequestUpdatedAt, expectedVerificationUpdatedAt: params.expectedVerificationUpdatedAt, actorId: otherActorId }),
      ]);
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true, rejections: true } });
      expect(["APPROVED", "REJECTED"], `round ${round}`).toContain(after.status);
      if (after.status === "APPROVED") {
        expect(after.rejections).toHaveLength(0);
        expect(after.verification?.decision).toBe("APPROVED_PRIVATE");
      } else {
        expect(after.rejections).toHaveLength(1);
        expect(after.verification?.decision ?? "DECLINED").toBe("DECLINED");
      }
    }
  });

  it("queues no email when the applicant gave no address, and still approves", async () => {
    const request = await makeRequest({ email: null });
    await approveAssistanceRequest(await input(request.id));
    expect(await counts(request.id)).toEqual({ audits: 1, notifications: 0 });
  });

  it("keeps the audit event and the email free of the private summary and notes", async () => {
    const request = await makeRequest();
    await approveAssistanceRequest(await input(request.id, { fields: { ...fields, verificationSummary: "PRIVATE-SUMMARY-" + tag, otherFundingNotes: "PRIVATE-NOTE-" + tag } }));
    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { entityId: request.id, action: "assistance.approved" } });
    const notification = await prisma.notification.findFirstOrThrow({ where: { assistanceRequestId: request.id } });
    for (const text of [JSON.stringify(audit), JSON.stringify(notification)]) expect(text).not.toContain("PRIVATE-");
    expect(notification.payload).toEqual({ referenceNumber: request.referenceNumber, status: "APPROVED" });
  });
  describe("saving review progress without deciding", () => {
    const draft = (requestId: string, over: Record<string, unknown> = {}) => input(requestId).then(base => ({ ...base, route: null as ApprovalInput["route"] | null, ...over }));

    it("13. keeps whatever was entered, incomplete as it is, without recording an approval or changing the status", async () => {
      const request = await makeRequest();
      const partial = { ...fields, needConfirmed: false, evidenceReviewed: false, verifiedNeedAmount: null, paymentDestination: "", verificationSummary: "Half-written summary", zakatStatus: "UNREVIEWED" };
      expect(await saveApprovalDraft(await draft(request.id, { fields: partial }))).toBe("saved");
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
      expect(after.status).toBe("UNDER_VERIFICATION");
      expect(after.verification).toMatchObject({ decision: "PENDING", needConfirmed: false, verificationSummary: "Half-written summary", completedAt: null, reviewedById: null });
      expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
    });

    it("stores a chosen route as a leaning, not a decision: no completion, no reviewer, no email", async () => {
      const request = await makeRequest();
      await saveApprovalDraft(await draft(request.id, { route: "APPROVED_PUBLIC", fields: publicFields }));
      const after = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
      expect(after).toMatchObject({ decision: "APPROVED_PUBLIC", completedAt: null, reviewedById: null });
      expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id } })).status).toBe("UNDER_VERIFICATION");
      expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
    });

    it("lets the same record be saved again, and then approved from that saved progress", async () => {
      const request = await makeRequest();
      await saveApprovalDraft(await draft(request.id, { fields: { ...fields, verificationSummary: "First pass" } }));
      await saveApprovalDraft(await draft(request.id, { fields: { ...fields, verificationSummary: "Second pass" } }));
      expect(await prisma.assistanceVerification.count({ where: { assistanceRequestId: request.id } })).toBe(1);
      const result = await approveAssistanceRequest(await input(request.id));
      expect(result.outcome).toBe("approved");
    });

    it("refuses a stale version, and does nothing for a request that is not open to review", async () => {
      const request = await makeRequest();
      const stale = await draft(request.id);
      await prisma.assistanceRequest.update({ where: { id: request.id }, data: { internalNotes: "Changed" } });
      expect(await refused(saveApprovalDraft(stale))).toBeInstanceOf(AssistanceApprovalError);
      for (const status of ["APPROVED", "REJECTED", "CLOSED", "CONVERTED_TO_APPEAL"] as const) {
        const other = await makeRequest({ status });
        expect(await saveApprovalDraft(await draft(other.id)), status).toBe("skipped");
        expect(await prisma.assistanceVerification.count({ where: { assistanceRequestId: other.id } }), status).toBe(0);
      }
    });

    it.each(["PENDING", "REFERRED"] as const)("stores %s after an earlier public draft without approving", async draftDecision => {
      const request = await makeRequest();
      await saveApprovalDraft(await draft(request.id, { route: "APPROVED_PUBLIC", fields: publicFields }));
      await saveApprovalDraft(await draft(request.id, { draftDecision }));
      const after = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
      expect(after).toMatchObject({ decision: draftDecision, approvedPublicTarget: null, completedAt: null, reviewedById: null });
      expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
    });

    it.each([undefined, false, true])("preserves completed verification unless reopening authority is explicitly granted (%s)", async authority => {
      const request = await makeRequest();
      await saveApprovalDraft(await draft(request.id, { route: "APPROVED_PRIVATE" }));
      const before = await prisma.assistanceVerification.update({
        where: { assistanceRequestId: request.id },
        data: { completedAt: new Date("2026-11-22T04:00:00Z"), reviewedById: actorId },
      });
      const params = await draft(request.id, {
        actorId: otherActorId, draftDecision: "PENDING",
        fields: { ...fields, verificationSummary: "Synthetic reopening attempt" },
        canReopenCompletedVerification: authority,
      });
      if (authority === true) {
        expect(await saveApprovalDraft(params)).toBe("saved");
        const after = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
        expect(after).toMatchObject({ completedAt: null, reviewedById: null, decision: "PENDING", verificationSummary: "Synthetic reopening attempt" });
      } else {
        await expect(saveApprovalDraft(params)).rejects.toThrow("Approval permission is required to reopen a completed verification");
        expect(await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } })).toEqual(before);
      }
      expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id } })).status).toBe("UNDER_VERIFICATION");
      expect(await prisma.auditEvent.count({ where: { entityType: "AssistanceRequest", entityId: request.id } })).toBe(0);
      expect(await counts(request.id)).toEqual({ audits: 0, notifications: 0 });
    });

    it("does not store a public target on a route that is not public", async () => {
      const request = await makeRequest();
      await saveApprovalDraft(await draft(request.id, { route: "APPROVED_PRIVATE", fields: { ...fields, approvedPublicTarget: 1000 } }));
      expect((await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } })).approvedPublicTarget).toBeNull();
    });
  });

  it("reports earliest recorded decisions for a bounded synthetic receipt cohort without inferring legacy decisions", async () => {
    const received = new Date("2040-03-01T00:00:00Z");
    const now = new Date("2040-03-31T00:00:00Z");
    const day = 86_400_000;
    const at = (days: number, extra = 0) => new Date(received.getTime() + days * day + extra);
    const cases = await Promise.all([makeRequest({ status: "APPROVED" }), makeRequest({ status: "REJECTED" }), makeRequest({ status: "UNDER_VERIFICATION" }), makeRequest({ status: "SUBMITTED" }), makeRequest({ status: "CLOSED" }), makeRequest({ status: "APPROVED" }), makeRequest({ status: "REJECTED" })]);
    await prisma.assistanceRequest.updateMany({ where: { id: { in: cases.map(item => item.id) } }, data: { createdAt: received } });
    await prisma.assistanceRequest.updateMany({ where: { id: { in: cases.slice(4).map(item => item.id) } }, data: { category: "EDUCATION" } });
    await prisma.assistanceRequest.update({ where: { id: cases[0].id }, data: { acceptedAt: at(1) } });
    await prisma.assistanceRequest.update({ where: { id: cases[5].id }, data: { acceptedAt: at(-1) } });
    for (const [index, rejectedAt] of [[1, at(7)], [2, at(9)], [6, at(7, 1)]] as const) {
      await prisma.assistanceRejection.create({ data: { assistanceRequestId: cases[index].id, reason: "Synthetic evidence", rejectedById: actorId, previousStatus: "UNDER_VERIFICATION", rejectedAt } });
    }
    await prisma.auditEvent.create({ data: { actorId, entityType: "AssistanceRequest", entityId: cases[2].id, action: "assistance.approved", createdAt: at(2) } });
    await prisma.auditEvent.create({ data: { actorId, entityType: "AssistanceRequest", entityId: cases[3].id, action: "assistance.approved", createdAt: at(31) } });
    // A saved draft can exist without a verification audit event. Reopening or later
    // edits must not move its earliest evidence. Exclude unrelated actions, pre-receipt
    // timestamps and future evidence; retain exact threshold boundaries.
    for (const [index, createdAt] of [[0, at(1)], [1, at(7)], [3, at(-1)], [5, at(31)]] as const) {
      await prisma.assistanceVerification.create({ data: { assistanceRequestId: cases[index].id, createdAt } });
    }
    for (const [index, action, createdAt] of [
      [0, "assistance.verification_saved", at(2)],
      [1, "assistance.verification_completed", at(8)],
      [2, "assistance.verification_saved", at(7, 1)],
      [3, "assistance.verification_saved", at(-1)],
      [4, "assistance.assigned", at(1)],
      [5, "assistance.verification_saved", at(31)],
      [6, "assistance.verification_completed", at(0)],
    ] as const) {
      await prisma.auditEvent.create({ data: { actorId, entityType: "AssistanceRequest", entityId: cases[index].id, action, createdAt } });
    }
    expect(await loadAssistanceDecisionReport(prisma, "live", now)).toEqual({ received: 7, recorded: 4, withinDay: 1, withinWeek: 2, overWeek: 1, openWithoutDecision: 1, otherWithoutDecision: 2, verificationRecorded: 4, verificationWithinDay: 2, verificationWithinWeek: 1, verificationOverWeek: 1, verificationMissing: 3 });
    expect(await loadAssistanceDecisionReport(prisma, "tests", now)).toEqual({ received: 0, recorded: 0, withinDay: 0, withinWeek: 0, overWeek: 0, openWithoutDecision: 0, otherWithoutDecision: 0, verificationRecorded: 0, verificationWithinDay: 0, verificationWithinWeek: 0, verificationOverWeek: 0, verificationMissing: 0 });
    const breakdown = await loadAssistanceDecisionBreakdown(prisma, "live", now);
    expect(breakdown.categories).toEqual([
      { category: "MEDICAL", received: 4, recorded: 3, withinDay: 1, withinWeek: 2, overWeek: 0, openWithoutDecision: 1, otherWithoutDecision: 0, verificationRecorded: 3, verificationWithinDay: 1, verificationWithinWeek: 1, verificationOverWeek: 1, verificationMissing: 1 },
      { category: "EDUCATION", received: 3, recorded: 1, withinDay: 0, withinWeek: 0, overWeek: 1, openWithoutDecision: 0, otherWithoutDecision: 2, verificationRecorded: 1, verificationWithinDay: 1, verificationWithinWeek: 0, verificationOverWeek: 0, verificationMissing: 2 },
    ]);
    expect((await loadAssistanceDecisionBreakdown(prisma, "tests", now)).categories).toEqual([]);
  });

  describe("annual individual-case capacity", () => {
    const fillCapacity = async (now = new Date()) => {
      const existing = await capacityUsed(prisma, now);
      for (let i = existing; i < INDIVIDUAL_CASE_ANNUAL_CAPACITY; i++) {
        const filler = await makeRequest({ status: "APPROVED" });
        await prisma.assistanceRequest.update({ where: { id: filler.id }, data: { acceptedAt: now } });
      }
    };

    it("fills the current IST-year capacity without counting adjacent-year accepted cases", async () => {
      const now = new Date();
      const { start, end } = capacityYearBounds(now);
      const previous = await makeRequest({ status: "CLOSED" });
      const future = await makeRequest({ status: "APPROVED" });
      const previousAcceptance = new Date(start.getTime() - 1);
      await prisma.assistanceRequest.update({ where: { id: previous.id }, data: { acceptedAt: previousAcceptance } });
      await prisma.assistanceRequest.update({ where: { id: future.id }, data: { acceptedAt: end } });

      await fillCapacity(now);

      // Count independently of the fixture's helper to detect an all-years query regression.
      expect(await prisma.assistanceRequest.count({
        where: { acceptedAt: { gte: start, lt: end }, status: { in: ["APPROVED", "CONVERTED_TO_APPEAL", "CLOSED"] } },
      })).toBe(INDIVIDUAL_CASE_ANNUAL_CAPACITY);
      expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: previous.id } })).acceptedAt).toEqual(previousAcceptance);
      expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: future.id } })).acceptedAt).toEqual(end);
    });

    it("records the acceptance time and refuses a thirteenth case without an exception", async () => {
      await fillCapacity();
      const blocked = await makeRequest();
      const error = await refused(approveAssistanceRequest(await input(blocked.id)));
      expect(error?.code).toBe("capacity_full");
      expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: blocked.id } })).status).toBe("UNDER_VERIFICATION");
    });

    it("accepts beyond capacity only with a stated exception, which is audited", async () => {
      await fillCapacity();
      const request = await makeRequest();
      await approveAssistanceRequest(await input(request.id, { capacityExceptionNote: "Owner decision: critical surgery" }));
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id } });
      expect(after).toMatchObject({ status: "APPROVED", capacityExceptionNote: "Owner decision: critical surgery" });
      expect(after.acceptedAt).not.toBeNull();
    });

    it("lets concurrent acceptances take only the places left", async () => {
      const now = new Date();
      await fillCapacity(now);
      // Free exactly one place: a counted current-year filler is moved back into review.
      const filler = await prisma.assistanceRequest.findFirstOrThrow({
        where: { ...countedCaseWhere(now), id: { in: requestIds }, status: "APPROVED" },
        orderBy: [{ acceptedAt: "asc" }, { id: "asc" }],
      });
      await prisma.assistanceRequest.update({ where: { id: filler.id }, data: { status: "UNDER_VERIFICATION" } });
      const a = await makeRequest();
      const b = await makeRequest();
      const [aInput, bInput] = await Promise.all([input(a.id), input(b.id)]);
      const results = await Promise.allSettled([approveAssistanceRequest(aInput), approveAssistanceRequest(bInput)]);
      expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
      const rejected = results.find(result => result.status === "rejected");
      const prismaCode = rejected?.reason instanceof Prisma.PrismaClientKnownRequestError && /^P\d{4}$/.test(rejected.reason.code)
        ? rejected.reason.code : "unavailable";
      expect(rejected?.reason, "Expected capacity refusal; Prisma error code: " + prismaCode).toBeInstanceOf(AssistanceApprovalError);
      expect(rejected?.reason).toMatchObject({ code: "capacity_full" });
      const after = await prisma.assistanceRequest.findMany({ where: { id: { in: [a.id, b.id] } }, select: { status: true, acceptedAt: true } });
      expect(after).toHaveLength(2);
      expect(after.filter(row => row.status === "APPROVED" && row.acceptedAt !== null)).toHaveLength(1);
      expect(after.filter(row => row.status === "UNDER_VERIFICATION" && row.acceptedAt === null)).toHaveLength(1);
    });
  });
});
