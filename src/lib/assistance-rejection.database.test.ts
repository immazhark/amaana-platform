import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { loadRetentionScheduleSummary } from "./retention-review";
import { AssistanceRejectionError, rejectAssistanceRequest } from "./assistance-rejection-service";

// A real PostgreSQL test, deliberately unavailable to hosted and production DBs. Synthetic data only.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("assistance rejection PostgreSQL invariants", () => {
  const tag = "synthetic-reject-" + randomUUID().replaceAll("-", "");
  let actorId = "";
  let otherActorId = "";
  let isolatedTargetAccepted = false;
  const requestIds: string[] = [];
  const appealIds: string[] = [];

  async function makeRequest(over: { status?: "SUBMITTED" | "DOCUMENTS_REQUESTED" | "UNDER_VERIFICATION" | "APPROVED" | "REJECTED" | "CLOSED" | "CONVERTED_TO_APPEAL"; email?: string | null; internalNotes?: string; appealId?: string } = {}) {
    const request = await prisma.assistanceRequest.create({
      data: {
        referenceNumber: "AF-TEST-" + randomUUID().slice(0, 8).toUpperCase(), applicantName: "Synthetic Applicant", phone: "9999999999", city: "Synthetic City",
        category: "MEDICAL", description: "Synthetic description for a rejection test, long enough to be a realistic request.",
        consentGivenAt: new Date(), trackingTokenHash: tag, status: over.status ?? "SUBMITTED",
        email: over.email === undefined ? tag + "@example.invalid" : over.email, internalNotes: over.internalNotes ?? null, appealId: over.appealId ?? null,
      },
    });
    requestIds.push(request.id);
    return request;
  }

  const input = async (requestId: string, over: { reason?: string; actor?: string } = {}) => {
    const request = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: requestId }, select: { updatedAt: true, verification: { select: { updatedAt: true } } } });
    return { requestId, reason: over.reason ?? "Duplicate of an earlier request", expectedRequestUpdatedAt: request.updatedAt, expectedVerificationUpdatedAt: request.verification?.updatedAt ?? null, actorId: over.actor ?? actorId };
  };
  const refused = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { return error; } return null; };
  const counts = async (requestId: string) => ({
    rejections: await prisma.assistanceRejection.count({ where: { assistanceRequestId: requestId } }),
    audits: await prisma.auditEvent.count({ where: { entityType: "AssistanceRequest", entityId: requestId, action: "assistance.rejected" } }),
    notifications: await prisma.notification.count({ where: { assistanceRequestId: requestId } }),
  });

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Assistance rejection DB tests require the isolated loopback amaana database");
    }
    isolatedTargetAccepted = true;
    actorId = (await prisma.user.create({ data: { name: "Synthetic approver", email: tag + "-a@example.invalid", status: "ACTIVE" }, select: { id: true } })).id;
    otherActorId = (await prisma.user.create({ data: { name: "Synthetic other", email: tag + "-b@example.invalid", status: "ACTIVE" }, select: { id: true } })).id;
  });

  afterAll(async () => {
    if (!isolatedTargetAccepted) return;
    await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS "synthetic_reject_fail" ON "AuditEvent"');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS "synthetic_reject_fail"()');
    await prisma.notification.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorId: { in: [actorId, otherActorId] } }, { entityId: { in: requestIds } }] } });
    await prisma.assistanceRejection.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.assistanceVerification.deleteMany({ where: { assistanceRequestId: { in: requestIds } } });
    await prisma.assistanceRequest.deleteMany({ where: { id: { in: requestIds } } });
    await prisma.appeal.deleteMany({ where: { id: { in: appealIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [actorId, otherActorId] } } });
  });

  it("groups the latest document-scoped retention decisions without treating due reminders as hold release", async () => {
    const request = await makeRequest();
    const unrelated = await makeRequest();
    const rollback = new Error("synthetic retention review rollback");
    await expect(prisma.$transaction(async tx => {
      const today = "2026-11-26";
      const before = await loadRetentionScheduleSummary(tx, today);
      const doc = async (suffix: string) => tx.assistanceDocument.create({ data: { assistanceRequestId: request.id, originalName: "synthetic.pdf", mimeType: "application/pdf", sizeBytes: 10, objectKey: "synthetic/" + tag + suffix } });
      const [held, released, unscheduled, unreviewed, invalid] = await Promise.all(["held", "released", "unscheduled", "unreviewed", "invalid"].map(doc));
      if (!held || !released || !unscheduled || !unreviewed || !invalid) throw new Error("Missing synthetic document");
      const event = (documentId: string, action: string, reviewAfter: string | null, day: number, entityId = request.id) => tx.auditEvent.create({ data: { actorId, entityType: "AssistanceRequest", entityId, action: "assistance." + action, createdAt: new Date(Date.UTC(2026, 10, day)), metadata: { documentId, reviewAfter, reason: "Synthetic only" } } });
      await event(held.id, "document_legal_hold_placed", "2026-11-26T00:00:00.000Z", 20);
      await event(held.id, "document_legal_hold_released", null, 25, unrelated.id);
      await event(released.id, "document_legal_hold_placed", "2026-11-25T00:00:00.000Z", 20);
      await event(released.id, "document_legal_hold_released", "2026-12-01T00:00:00.000Z", 21);
      await event(unscheduled.id, "document_retention_reviewed", "2026-11-25T00:00:00.000Z", 20);
      await event(unscheduled.id, "document_retention_reviewed", null, 21);
      await event(invalid.id, "document_retention_reviewed", "2026-02-30T00:00:00.000Z", 21);
      const after = await loadRetentionScheduleSummary(tx, today);
      expect(after).toEqual({ total: before.total + 5, held: before.held + 1, due: before.due + 1, upcoming: before.upcoming + 1, unreviewed: before.unreviewed + 1, unscheduled: before.unscheduled + 1, invalid: before.invalid + 1 });
      throw rollback;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })).rejects.toBe(rollback);
  });

  it("1. rejects an untouched SUBMITTED request with no verification record, using only a reason", async () => {
    const request = await makeRequest();
    const result = await rejectAssistanceRequest(await input(request.id, { reason: "Duplicate" }));
    expect(result).toMatchObject({ outcome: "rejected", status: "REJECTED" });
    const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true, rejections: true } });
    expect(after.status).toBe("REJECTED");
    expect(after.verification).toBeNull();
    expect(after.rejections).toHaveLength(1);
    expect(after.rejections[0]).toMatchObject({ reason: "Duplicate", rejectedById: actorId, previousStatus: "SUBMITTED" });
    expect(await counts(request.id)).toEqual({ rejections: 1, audits: 1, notifications: 1 });
  });

  it("2. rejects a partially reviewed request with amounts, destination, consent and Zakat unresolved", async () => {
    const request = await makeRequest({ status: "UNDER_VERIFICATION" });
    await prisma.assistanceVerification.create({ data: { assistanceRequestId: request.id } });
    await rejectAssistanceRequest(await input(request.id));
    const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
    expect(after.status).toBe("REJECTED");
    expect(after.verification).toMatchObject({ verifiedNeedAmount: null, paymentDestination: null, publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED" });
  });

  it("3 and 5. fabricates no positive fact: need, evidence, funding, amounts, consent and Zakat stay as the reviewer left them", async () => {
    const request = await makeRequest({ status: "UNDER_VERIFICATION" });
    await prisma.assistanceVerification.create({ data: {
      assistanceRequestId: request.id, needConfirmed: false, evidenceReviewed: false, otherFundingChecked: false, verifiedNeedAmount: 1234.5,
      paymentDestination: "Saved earlier", verificationSummary: "Earlier partial summary", publicNameConsent: "NOT_ALLOWED", photoConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED",
    } });
    await rejectAssistanceRequest(await input(request.id));
    const verification = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
    expect(verification).toMatchObject({
      needConfirmed: false, evidenceReviewed: false, otherFundingChecked: false, paymentDestination: "Saved earlier", verificationSummary: "Earlier partial summary",
      publicNameConsent: "NOT_ALLOWED", photoConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED",
    });
    expect(verification.verifiedNeedAmount?.toNumber()).toBe(1234.5);
    expect(verification.decision).toBe("DECLINED");
    expect(verification.reviewedById).toBe(actorId);
    expect(verification.completedAt).not.toBeNull();
  });

  it("records a declined decision over an earlier approval without touching the evidence behind it", async () => {
    const request = await makeRequest({ status: "APPROVED" });
    await prisma.assistanceVerification.create({ data: { assistanceRequestId: request.id, decision: "APPROVED_PRIVATE", needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: 500, paymentDestination: "Hospital", verificationSummary: "Checked", zakatStatus: "NOT_APPLICABLE", completedAt: new Date("2026-11-01T00:00:00Z") } });
    await rejectAssistanceRequest(await input(request.id));
    const verification = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
    expect(verification).toMatchObject({ decision: "DECLINED", needConfirmed: true, evidenceReviewed: true, paymentDestination: "Hospital", verificationSummary: "Checked", zakatStatus: "NOT_APPLICABLE" });
    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { entityId: request.id, action: "assistance.rejected" } });
    expect(audit.metadata).toMatchObject({ previousStatus: "APPROVED", previousDecision: "APPROVED_PRIVATE" });
  });

  it("6. keeps notes and documents, stores the reason privately and keeps it out of the audit event and the email payload", async () => {
    const request = await makeRequest({ internalNotes: "Earlier internal note", status: "DOCUMENTS_REQUESTED" });
    await prisma.assistanceDocument.create({ data: { assistanceRequestId: request.id, originalName: "evidence.pdf", mimeType: "application/pdf", sizeBytes: 10, objectKey: "synthetic/" + tag } });
    const documentsBefore = await prisma.assistanceDocument.count({ where: { assistanceRequestId: request.id } });
    expect(documentsBefore).toBe(1);
    const secret = "PRIVATE-REASON-" + tag;
    await rejectAssistanceRequest(await input(request.id, { reason: secret }));
    const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(after.internalNotes).toBe("Earlier internal note");
    expect(await prisma.assistanceDocument.count({ where: { assistanceRequestId: request.id } })).toBe(documentsBefore);
    expect((await prisma.assistanceRejection.findFirstOrThrow({ where: { assistanceRequestId: request.id } })).reason).toBe(secret);
    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { entityId: request.id, action: "assistance.rejected" } });
    expect(JSON.stringify(audit)).not.toContain(secret);
    const notification = await prisma.notification.findFirstOrThrow({ where: { assistanceRequestId: request.id } });
    expect(notification).toMatchObject({ templateKey: "assistance-status-updated", status: "PENDING" });
    expect(JSON.stringify(notification)).not.toContain(secret);
    expect(notification.payload).toEqual({ referenceNumber: request.referenceNumber, status: "REJECTED" });
  });

  it("queues no email for an applicant without an email address, and still rejects", async () => {
    const request = await makeRequest({ email: null });
    await rejectAssistanceRequest(await input(request.id));
    expect(await counts(request.id)).toEqual({ rejections: 1, audits: 1, notifications: 0 });
  });

  it("4. refuses a missing, blank or oversized reason at the database even if the application is bypassed", async () => {
    const request = await makeRequest();
    for (const reason of ["", "  ", "ab", "x".repeat(2001)]) {
      await expect(prisma.assistanceRejection.create({ data: { assistanceRequestId: request.id, reason, rejectedById: actorId, previousStatus: "SUBMITTED" } }), JSON.stringify(reason.slice(0, 5))).rejects.toThrow();
    }
    expect(await prisma.assistanceRejection.count({ where: { assistanceRequestId: request.id } })).toBe(0);
  });

  it("8. refuses a stale request version without overwriting anything", async () => {
    const request = await makeRequest();
    const stale = await input(request.id);
    await prisma.assistanceRequest.update({ where: { id: request.id }, data: { internalNotes: "Another reviewer changed this" } });
    const error = await refused(rejectAssistanceRequest(stale));
    expect(error).toBeInstanceOf(AssistanceRejectionError);
    expect((error as AssistanceRejectionError).code).toBe("stale_request");
    const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(after).toMatchObject({ status: "SUBMITTED", internalNotes: "Another reviewer changed this" });
    expect(await counts(request.id)).toEqual({ rejections: 0, audits: 0, notifications: 0 });
  });

  it("8. refuses a stale verification version, and a verification that appeared after the page loaded", async () => {
    const request = await makeRequest({ status: "UNDER_VERIFICATION" });
    const verification = await prisma.assistanceVerification.create({ data: { assistanceRequestId: request.id } });
    const stale = await input(request.id);
    await prisma.assistanceVerification.update({ where: { id: verification.id }, data: { verificationSummary: "Edited after the page loaded" } });
    expect(((await refused(rejectAssistanceRequest(stale))) as AssistanceRejectionError).code).toBe("stale_verification");
    const fresh = await makeRequest();
    const loadedWithoutVerification = await input(fresh.id);
    await prisma.assistanceVerification.create({ data: { assistanceRequestId: fresh.id } });
    expect(((await refused(rejectAssistanceRequest(loadedWithoutVerification))) as AssistanceRejectionError).code).toBe("stale_verification");
    expect(await counts(request.id)).toEqual({ rejections: 0, audits: 0, notifications: 0 });
    expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: fresh.id } })).status).toBe("SUBMITTED");
  });

  it("12. refuses a converted request, by status and by linked appeal, with nothing changed", async () => {
    const appeal = await prisma.appeal.create({ data: { slug: "synthetic-" + randomUUID().slice(0, 8), title: "Synthetic appeal title", summary: "s", story: "s", category: "MEDICAL", beneficiaryName: "Synthetic", goalAmount: 100, createdById: actorId } });
    appealIds.push(appeal.id);
    const linked = await makeRequest({ status: "APPROVED", appealId: appeal.id });
    expect(((await refused(rejectAssistanceRequest(await input(linked.id)))) as AssistanceRejectionError).code).toBe("linked_appeal");
    const converted = await makeRequest({ status: "CONVERTED_TO_APPEAL" });
    expect(((await refused(rejectAssistanceRequest(await input(converted.id)))) as AssistanceRejectionError).code).toBe("linked_appeal");
    for (const id of [linked.id, converted.id]) expect(await counts(id)).toEqual({ rejections: 0, audits: 0, notifications: 0 });
    expect((await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: linked.id } })).status).toBe("APPROVED");
  });

  it("refuses a closed request, which has to be reopened first, and one that does not exist", async () => {
    const closed = await makeRequest({ status: "CLOSED" });
    expect(((await refused(rejectAssistanceRequest(await input(closed.id)))) as AssistanceRejectionError).code).toBe("closed");
    expect(((await refused(rejectAssistanceRequest({ ...(await input(closed.id)), requestId: "missing-request" }))) as AssistanceRejectionError).code).toBe("not_found");
  });

  it("rejects from every eligible status", async () => {
    for (const status of ["DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"] as const) {
      const request = await makeRequest({ status });
      expect((await rejectAssistanceRequest(await input(request.id))).outcome, status).toBe("rejected");
      expect((await prisma.assistanceRejection.findFirstOrThrow({ where: { assistanceRequestId: request.id } })).previousStatus).toBe(status);
    }
  });

  it("10. makes a repeat submission safe: one decision, one audit event, one email, and the original record is returned", async () => {
    const request = await makeRequest();
    const first = await input(request.id, { reason: "First reason" });
    const original = await rejectAssistanceRequest(first);
    const repeat = await rejectAssistanceRequest({ ...first, reason: "A different reason typed on retry", actorId: otherActorId });
    expect(repeat.outcome).toBe("already_rejected");
    expect(original.rejectedAt).not.toBeNull();
    expect(repeat.rejectedAt?.getTime()).toBe(original.rejectedAt?.getTime());
    expect(await counts(request.id)).toEqual({ rejections: 1, audits: 1, notifications: 1 });
    expect((await prisma.assistanceRejection.findFirstOrThrow({ where: { assistanceRequestId: request.id } })).reason).toBe("First reason");
  });

  it("10. makes concurrent submissions one coherent decision with no duplicate event or email", async () => {
    const request = await makeRequest();
    const base = await input(request.id);
    const results = await Promise.allSettled([rejectAssistanceRequest(base), rejectAssistanceRequest({ ...base, actorId: otherActorId, reason: "Concurrent reviewer" }), rejectAssistanceRequest(base)]);
    for (const result of results) expect(result.status, JSON.stringify(result)).toBe("fulfilled");
    const outcomes = results.map(result => (result as PromiseFulfilledResult<{ outcome: string }>).value.outcome);
    expect(outcomes.filter(outcome => outcome === "rejected")).toHaveLength(1);
    expect(await counts(request.id)).toEqual({ rejections: 1, audits: 1, notifications: 1 });
  });

  it("9. never leaves a request rejected AND converted when a conversion races the rejection", async () => {
    for (let round = 0; round < 4; round += 1) {
      const request = await makeRequest({ status: "APPROVED" });
      const appeal = await prisma.appeal.create({ data: { slug: "synthetic-race-" + randomUUID().slice(0, 8), title: "Synthetic race appeal", summary: "s", story: "s", category: "MEDICAL", beneficiaryName: "Synthetic", goalAmount: 100, createdById: actorId } });
      appealIds.push(appeal.id);
      const params = await input(request.id);
      // The conversion keeps the real guard: it only links an APPROVED, unlinked request.
      const convert = prisma.assistanceRequest.updateMany({ where: { id: request.id, status: "APPROVED", appealId: null }, data: { status: "CONVERTED_TO_APPEAL", appealId: appeal.id } });
      await Promise.allSettled([rejectAssistanceRequest(params), convert]);
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { rejections: true } });
      const rejected = after.status === "REJECTED";
      const converted = after.status === "CONVERTED_TO_APPEAL";
      expect(rejected !== converted, `round ${round}: ${after.status}`).toBe(true);
      expect(after.rejections).toHaveLength(rejected ? 1 : 0);
      expect(Boolean(after.appealId)).toBe(converted);
    }
  });

  it("11. rolls the whole decision back when a later step fails: no status change, no record, no event, no email", async () => {
    const request = await makeRequest({ status: "UNDER_VERIFICATION" });
    await prisma.assistanceVerification.create({ data: { assistanceRequestId: request.id } });
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION "synthetic_reject_fail"() RETURNS trigger AS $$ BEGIN IF NEW."entityId" = '${request.id}' AND NEW."action" = 'assistance.rejected' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER "synthetic_reject_fail" BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION "synthetic_reject_fail"()');
    try {
      const before = await prisma.assistanceVerification.findUniqueOrThrow({ where: { assistanceRequestId: request.id } });
      expect(await refused(rejectAssistanceRequest(await input(request.id)))).not.toBeNull();
      const after = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id: request.id }, include: { verification: true } });
      expect(after.status).toBe("UNDER_VERIFICATION");
      expect(after.verification).toMatchObject({ decision: before.decision, completedAt: null, reviewedById: null });
      expect(await counts(request.id)).toEqual({ rejections: 0, audits: 0, notifications: 0 });
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS "synthetic_reject_fail" ON "AuditEvent"');
    }
  });

  it("keeps every decision when a request is reopened and rejected again, and never rewrites an earlier one", async () => {
    const request = await makeRequest();
    await rejectAssistanceRequest(await input(request.id, { reason: "First rejection" }));
    await prisma.assistanceRequest.update({ where: { id: request.id }, data: { status: "UNDER_VERIFICATION" } });
    await rejectAssistanceRequest(await input(request.id, { reason: "Second rejection after review" }));
    const reasons = (await prisma.assistanceRejection.findMany({ where: { assistanceRequestId: request.id }, orderBy: { rejectedAt: "asc" } })).map(row => row.reason);
    expect(reasons).toEqual(["First rejection", "Second rejection after review"]);
  });
});
