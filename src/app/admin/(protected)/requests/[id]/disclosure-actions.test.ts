import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(), has: vi.fn(), transaction: vi.fn(),
  disclosureFind: vi.fn(), observationFind: vi.fn(), evidenceCount: vi.fn(),
  create: vi.fn(), updateMany: vi.fn(), audit: vi.fn(),
  revalidate: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth, hasPermission: m.has }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: m.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import {
  proposeAnonymousOutcomeCopy, reviewAnonymousOutcomeCopy,
} from "./disclosure-actions";
import { ANONYMOUS_OUTCOME_COPY } from "@/lib/assistance-outcome-disclosure";

const version = new Date("2026-10-16T11:20:00.000Z");
const source = {
  id: "outcome-synthetic", assistanceRequestId: "case-synthetic",
  kind: "PARTIAL_SUPPORT", state: "REVIEWED", updatedAt: version,
  reportedById: "outcome-reporter", reviewedById: "outcome-reviewer",
  deliveryRecord: {
    kind: "IN_KIND", state: "CONFIRMED", evidenceDocumentId: "delivery-proof",
    financialReconciliation: null,
    assistanceRequest: {
      id: "case-synthetic", status: "APPROVED", appealId: null,
      verification: { decision: "APPROVED_PRIVATE", completedAt: version,
        confidentialityLevel: "STANDARD" },
    },
  },
};
const disclosure = {
  id: "disclosure-synthetic", state: "DRAFT",
  consentDocumentId: "specific-consent-document",
  copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
  preparedById: "copy-preparer", approvedById: null,
  approvedAt: null, updatedAt: version,
  observation: source,
};
const db = {
  assistanceOutcomeDisclosure: {
    findUnique: m.disclosureFind, create: m.create, updateMany: m.updateMany,
  },
  assistanceOutcomeObservation: { findUnique: m.observationFind },
  assistanceDocument: { count: m.evidenceCount },
  auditEvent: { create: m.audit },
};
function form(changes: Record<string, string> = {}) {
  const value = new FormData();
  Object.entries({
    id: "case-synthetic",
    observationId: "outcome-synthetic",
    consentDocumentId: "specific-consent-document",
    expectedObservationUpdatedAt: version.toISOString(),
    exactCopyConsentAttested: "yes",
    disclosureId: "disclosure-synthetic", decision: "APPROVED_COPY",
    expectedUpdatedAt: version.toISOString(),
    consentReviewAttested: "yes",
    ...changes,
  }).forEach(([key, data]) => value.set(key, data));
  return value;
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ id: "content-reviewer" });
  m.has.mockReturnValue(true);
  m.transaction.mockImplementation(async (cb: (tx: typeof db) => Promise<unknown>) => cb(db));
  m.disclosureFind.mockResolvedValue(null);
  m.observationFind.mockResolvedValue(source);
  m.evidenceCount.mockResolvedValue(2);
  m.create.mockResolvedValue({ id: "disclosure-synthetic" });
  m.updateMany.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-synthetic" });
  m.redirect.mockImplementation(() => { throw new Error("NAVIGATE"); });
});

describe("internal-only anonymous outcome copy proposal", () => {
  it("needs case update and view permissions before accessing private case evidence", async () => {
    m.has.mockReturnValue(false);
    await expect(proposeAnonymousOutcomeCopy(form())).rejects.toThrow("Case-view permission");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("stores only fixed wording and a distinct case-specific exact-consent document", async () => {
    await expect(proposeAnonymousOutcomeCopy(form())).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("assistance.update");
    expect(m.evidenceCount).toHaveBeenCalledWith({
      where: { assistanceRequestId: "case-synthetic",
        id: { in: ["delivery-proof", "specific-consent-document"] } },
    });
    expect(m.create).toHaveBeenCalledWith({
      data: {
        observationId: "outcome-synthetic",
        consentDocumentId: "specific-consent-document",
        copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
        preparedById: "content-reviewer",
      },
      select: { id: true },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "content-reviewer", action: "assistance.anonymous_outcome_copy_proposed",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: {
        disclosureId: "disclosure-synthetic", observationId: "outcome-synthetic",
      },
    } });
  });
  it("rejects reuse of delivery proof as exact-copy consent", async () => {
    await expect(proposeAnonymousOutcomeCopy(form({ consentDocumentId: "delivery-proof" })))
      .rejects.toThrow("must be separate");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("rejects confidential or unverified source observations", async () => {
    m.observationFind.mockResolvedValue({ ...source,
      deliveryRecord: { ...source.deliveryRecord, assistanceRequest: {
        ...source.deliveryRecord.assistanceRequest,
        verification: { ...source.deliveryRecord.assistanceRequest.verification,
          confidentialityLevel: "CONFIDENTIAL" },
      } },
    });
    await expect(proposeAnonymousOutcomeCopy(form())).rejects.toThrow("STANDARD-confidentiality");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("preserves idempotency for a matching proposal without second audit", async () => {
    m.disclosureFind.mockResolvedValue({
      preparedById: "content-reviewer",
      consentDocumentId: "specific-consent-document",
      copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
    });
    await expect(proposeAnonymousOutcomeCopy(form())).rejects.toThrow("NAVIGATE");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});

describe("independent anonymous copy approval and consent withdrawal", () => {
  beforeEach(() => { m.disclosureFind.mockResolvedValue(disclosure); });

  it("requires combined content, case view and approval authority", async () => {
    m.has.mockReturnValue(false);
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("Both case-view");
    expect(m.auth).toHaveBeenCalledWith("content.approve");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("approves copy internally only after a separate reviewer verifies fresh consent", async () => {
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("NAVIGATE");
    expect(m.evidenceCount).toHaveBeenCalledWith({
      where: { assistanceRequestId: "case-synthetic",
        id: { in: ["delivery-proof", "specific-consent-document"] } },
    });
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: "disclosure-synthetic", state: "DRAFT", updatedAt: version },
      data: { state: "APPROVED_COPY", approvedById: "content-reviewer", approvedAt: expect.any(Date) },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "content-reviewer", action: "assistance.anonymous_outcome_copy_reviewed",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: {
        disclosureId: "disclosure-synthetic",
        previousState: "DRAFT", state: "APPROVED_COPY",
      },
    } });
    expect(m.audit.mock.calls[0]?.[0]?.data?.metadata).not.toHaveProperty("copyText");
  });
  it("forbids the preparer and the original outcome reviewer from approving", async () => {
    m.auth.mockResolvedValueOnce({ id: "copy-preparer" });
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("independent");
    m.auth.mockResolvedValueOnce({ id: "outcome-reviewer" });
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("independent");
    expect(m.updateMany).not.toHaveBeenCalled();
  });
  it("blocks approval after exact-copy consent deletion or confidentiality change", async () => {
    m.evidenceCount.mockResolvedValueOnce(1);
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("is missing");
    m.disclosureFind.mockResolvedValueOnce({ ...disclosure,
      observation: { ...source, deliveryRecord: {
        ...source.deliveryRecord, assistanceRequest: {
          ...source.deliveryRecord.assistanceRequest,
          verification: { ...source.deliveryRecord.assistanceRequest.verification,
            confidentialityLevel: "HIGHLY_SENSITIVE" },
        },
      } },
    });
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("wording changed");
    expect(m.updateMany).not.toHaveBeenCalled();
  });
  it("allows withdrawal of previously approved private copy, retaining original approver", async () => {
    m.disclosureFind.mockResolvedValue({ ...disclosure,
      state: "APPROVED_COPY", approvedById: "first-approver", approvedAt: version,
    });
    await expect(reviewAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", consentReviewAttested: "", withdrawalReason: "CONSENT_WITHDRAWN",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: "assistance.anonymous_outcome_copy_reviewed",
      metadata: expect.objectContaining({
        withdrawalReason: "CONSENT_WITHDRAWN",
        previousApprovedById: "first-approver",
        previousApprovedAt: version.toISOString(),
      }),
    }) });
  });
  it("rejects a stale disclosure update without an audit entry", async () => {
    m.disclosureFind.mockResolvedValue({ ...disclosure,
      updatedAt: new Date("2026-10-16T12:20:00.000Z"),
    });
    await expect(reviewAnonymousOutcomeCopy(form())).rejects.toThrow("reviewer changed");
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});
