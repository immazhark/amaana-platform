import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANONYMOUS_OUTCOME_COPY } from "./assistance-outcome-disclosure";
import { withdrawStaleAnonymousOutcomeCopies } from "./assistance-outcome-invalidation";

const m = vi.hoisted(() => ({
  find: vi.fn(), update: vi.fn(), documents: vi.fn(), audit: vi.fn(),
}));
const tx = {
  assistanceOutcomeDisclosure: { findMany: m.find, updateMany: m.update },
  assistanceDocument: { findMany: m.documents },
  auditEvent: { create: m.audit },
};
const db = tx as unknown as Parameters<typeof withdrawStaleAnonymousOutcomeCopies>[0];
const caseRecord = {
  status: "APPROVED", appealId: null,
  verification: {
    decision: "APPROVED_PRIVATE",
    completedAt: new Date("2026-10-16T08:00:00.000Z"),
    confidentialityLevel: "STANDARD",
  },
};
const source = {
  id: "outcome-private", assistanceRequestId: "case-private",
  state: "REVIEWED", kind: "PARTIAL_SUPPORT",
  reportedById: "reporter", reviewedById: "reviewer",
  updatedAt: new Date("2026-10-16T09:00:00.000Z"),
  deliveryRecord: {
    kind: "IN_KIND", state: "CONFIRMED",
    evidenceDocumentId: "delivery-proof",
    financialReconciliation: null,
    assistanceRequest: { id: "case-private", ...caseRecord },
  },
};
const published = {
  id: "disclosure-one", state: "PUBLISHED",
  updatedAt: new Date("2026-10-16T10:00:00.000Z"),
  copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
  consentDocumentId: "consent-proof", observation: source,
};
const docs = [{ id: "delivery-proof" }, { id: "consent-proof" }];

beforeEach(() => {
  vi.resetAllMocks();
  m.find.mockResolvedValue([published]);
  m.documents.mockResolvedValue(docs);
  m.update.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-private" });
});

describe("transactional invalidation of anonymous public outcomes", () => {
  it("leaves a currently eligible and consent-backed publication untouched", async () => {
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "staff-private", "VERIFICATION_CHANGED",
    )).toBe(0);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
    expect(m.find).toHaveBeenCalledWith({
      where: {
        state: { in: ["DRAFT", "APPROVED_COPY", "PUBLISHED"] },
        observation: { is: { assistanceRequestId: "case-private" } },
      },
      select: expect.objectContaining({ id: true, observation: expect.anything() }),
    });
  });

  it("automatically withdraws publication when the source observation is voided", async () => {
    m.find.mockResolvedValue([{ ...published, observation: {
      ...source, state: "VOIDED",
    } }]);
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "reviewer-private", "OUTCOME_VOIDED",
    )).toBe(1);
    expect(m.update).toHaveBeenCalledWith({
      where: {
        id: "disclosure-one", state: "PUBLISHED", updatedAt: published.updatedAt,
      },
      data: { state: "WITHDRAWN" },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "reviewer-private",
      action: "assistance.anonymous_outcome_automatically_withdrawn",
      entityType: "AssistanceRequest", entityId: "case-private",
      metadata: {
        disclosureId: "disclosure-one",
        previousState: "PUBLISHED", trigger: "OUTCOME_VOIDED",
      },
    } });
  });

  it("withdraws BEFORE deletion when consent is about to be retired", async () => {
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "retention-reviewer", "DOCUMENT_DELETION", "consent-proof",
    )).toBe(1);
    expect(m.update).toHaveBeenCalledOnce();
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({
      metadata: expect.objectContaining({
        trigger: "DOCUMENT_DELETION", evidenceDeletionPlanned: true,
      }),
    }) });
  });

  it("also withdraws a disclosure if a consent document was already deleted", async () => {
    m.documents.mockResolvedValue([{ id: "delivery-proof" }]);
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "staff-private", "CASE_CHANGED",
    )).toBe(1);
  });

  it("retires unapproved drafts without inventing approval attribution", async () => {
    m.find.mockResolvedValue([{ ...published, state: "DRAFT", consentDocumentId: null }]);
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "staff-private", "VERIFICATION_CHANGED",
    )).toBe(1);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { state: "WITHDRAWN" },
    }));
  });

  it("retires a case after confidentiality is raised without deleting audit history", async () => {
    m.find.mockResolvedValue([{ ...published,
      observation: { ...source, deliveryRecord: {
        ...source.deliveryRecord, assistanceRequest: {
          ...source.deliveryRecord.assistanceRequest,
          verification: { ...caseRecord.verification, confidentialityLevel: "CONFIDENTIAL" },
        },
      } },
    }]);
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "staff-private", "VERIFICATION_CHANGED",
    )).toBe(1);
    expect(m.update).toHaveBeenCalledOnce();
  });

  it("aborts the enclosing transaction if a reviewer concurrently modifies the disclosure", async () => {
    m.update.mockResolvedValue({ count: 0 });
    await expect(withdrawStaleAnonymousOutcomeCopies(
      db, "case-private", "staff-private", "DOCUMENT_DELETION", "delivery-proof",
    )).rejects.toThrow("changed during privacy invalidation");
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("returns immediately for a case without active disclosures", async () => {
    m.find.mockResolvedValue([]);
    expect(await withdrawStaleAnonymousOutcomeCopies(
      db, "case-empty", "staff-private", "CASE_CHANGED",
    )).toBe(0);
    expect(m.documents).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });
});
