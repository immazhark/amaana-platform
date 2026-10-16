import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(), has: vi.fn(), transaction: vi.fn(),
  disclosureFind: vi.fn(), observationFind: vi.fn(), evidenceCount: vi.fn(),
  create: vi.fn(), updateMany: vi.fn(), audit: vi.fn(),
  revalidate: vi.fn(), redirect: vi.fn(), invalidate: vi.fn(), caseFind: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth, hasPermission: m.has }));
vi.mock("@/lib/assistance-outcome-invalidation", () => ({
  withdrawStaleAnonymousOutcomeCopies: m.invalidate,
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: m.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import {
  proposeAnonymousOutcomeCopy, publishAnonymousOutcomeCopy,
  reconcileAnonymousOutcomeDisclosures, reviewAnonymousOutcomeCopy,
  urgentlyWithdrawAnonymousOutcomeCopy,
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
  assistanceRequest: { findUnique: m.caseFind },
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
  m.caseFind.mockResolvedValue({ id: "case-synthetic" });
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
  it("refuses to replay a previously withdrawn consent proposal", async () => {
    m.disclosureFind.mockResolvedValue({
      state: "WITHDRAWN",
      preparedById: "content-reviewer",
      consentDocumentId: "specific-consent-document",
      copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
    });
    await expect(proposeAnonymousOutcomeCopy(form()))
      .rejects.toThrow("was withdrawn and cannot be reused");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
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
  it("rejects trying to downgrade a PUBLISHED copy back into internal approval", async () => {
    m.disclosureFind.mockResolvedValue({
      ...disclosure, state: "PUBLISHED",
      approvedById: "previous-approver", approvedAt: version,
    });
    await expect(reviewAnonymousOutcomeCopy(form()))
      .rejects.toThrow("decision is final");
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
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

describe("explicit final public release and withdrawal", () => {
  beforeEach(() => {
    m.disclosureFind.mockResolvedValue({
      ...disclosure, state: "APPROVED_COPY",
      approvedById: "previous-approver", approvedAt: version,
      publishedById: null,
    });
  });

  it("requires a DIFFERENT authorized publisher and rechecks exact-copy consent", async () => {
    await expect(publishAnonymousOutcomeCopy(form({
      publicationAttested: "yes",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("content.approve");
    expect(m.updateMany).toHaveBeenCalledWith({
      where: {
        id: "disclosure-synthetic", state: "APPROVED_COPY",
        updatedAt: version, publishedAt: null,
      },
      data: {
        state: "PUBLISHED", publishedAt: expect.any(Date),
        publishedById: "content-reviewer",
      },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "content-reviewer",
      action: "assistance.anonymous_outcome_explicitly_published",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: {
        disclosureId: "disclosure-synthetic",
        observationId: "outcome-synthetic",
      },
    } });
    expect(m.revalidate).toHaveBeenCalledWith("/impact");
  });

  it("never publishes merely because a copy was approved or an actor skipped attestation", async () => {
    await expect(publishAnonymousOutcomeCopy(form())).rejects.toThrow("Explicitly confirm");
    expect(m.transaction).not.toHaveBeenCalled();
    m.disclosureFind.mockResolvedValue({ ...disclosure, state: "DRAFT" });
    await expect(publishAnonymousOutcomeCopy(form({ publicationAttested: "yes" })))
      .rejects.toThrow("independently approved");
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("denies final release to the copy approver, preparer or outcome reviewer", async () => {
    for (const id of ["previous-approver", "copy-preparer", "outcome-reviewer"]) {
      m.auth.mockResolvedValueOnce({ id });
      await expect(publishAnonymousOutcomeCopy(form({ publicationAttested: "yes" })))
        .rejects.toThrow("different authorized publisher");
    }
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("refuses publication after consent deletion, confidentiality withdrawal or stale revision", async () => {
    m.evidenceCount.mockResolvedValueOnce(1);
    await expect(publishAnonymousOutcomeCopy(form({ publicationAttested: "yes" })))
      .rejects.toThrow("supporting evidence is missing");
    m.disclosureFind.mockResolvedValueOnce({
      ...disclosure, state: "APPROVED_COPY",
      approvedById: "previous-approver", approvedAt: version,
      observation: {
        ...source, deliveryRecord: {
          ...source.deliveryRecord, assistanceRequest: {
            ...source.deliveryRecord.assistanceRequest,
            verification: {
              ...source.deliveryRecord.assistanceRequest.verification,
              confidentialityLevel: "HIGHLY_SENSITIVE",
            },
          },
        },
      },
    });
    await expect(publishAnonymousOutcomeCopy(form({ publicationAttested: "yes" })))
      .rejects.toThrow("Consent, case eligibility");
    m.disclosureFind.mockResolvedValueOnce({
      ...disclosure, state: "APPROVED_COPY",
      approvedById: "previous-approver", approvedAt: version,
      updatedAt: new Date("2026-10-16T11:21:00Z"),
    });
    await expect(publishAnonymousOutcomeCopy(form({ publicationAttested: "yes" })))
      .rejects.toThrow("changed");
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("withdrawing a published note keeps original attribution and invalidates public impact", async () => {
    m.disclosureFind.mockResolvedValue({
      ...disclosure, state: "PUBLISHED",
      approvedById: "previous-approver", approvedAt: version,
    });
    await expect(reviewAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", withdrawalReason: "CONSENT_WITHDRAWN",
      consentReviewAttested: "",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: "disclosure-synthetic", state: "PUBLISHED", updatedAt: version },
      data: { state: "WITHDRAWN" },
    });
    expect(m.revalidate).toHaveBeenCalledWith("/impact");
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({
      metadata: expect.objectContaining({
        previousState: "PUBLISHED", state: "WITHDRAWN",
        withdrawalReason: "CONSENT_WITHDRAWN",
      }),
    }) });
  });
});

describe("manual private-publication privacy reconciliation", () => {
  it("checks current case and invokes only the fail-closed withdrawal routine", async () => {
    const input = form({ id: "case-synthetic" });
    await expect(reconcileAnonymousOutcomeDisclosures(input)).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("content.approve");
    expect(m.caseFind).toHaveBeenCalledWith({
      where: { id: "case-synthetic" }, select: { id: true },
    });
    expect(m.invalidate).toHaveBeenCalledWith(
      db, "case-synthetic", "content-reviewer", "MANUAL_RECONCILIATION",
    );
    expect(m.revalidate).toHaveBeenCalledWith("/impact");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.updateMany).not.toHaveBeenCalled();
  });
  it("refuses reconciliation to staff missing assistance approval permission", async () => {
    m.has.mockReturnValue(false);
    await expect(reconcileAnonymousOutcomeDisclosures(form())).rejects.toThrow(
      "Case-view and assistance-approval permissions",
    );
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("blocks a stale reconciliation for a case that does not exist", async () => {
    m.caseFind.mockResolvedValue(null);
    await expect(reconcileAnonymousOutcomeDisclosures(form())).rejects.toThrow("not found");
    expect(m.invalidate).not.toHaveBeenCalled();
  });
});

describe("urgent assistance-staff consent takedown", () => {
  beforeEach(() => {
    m.disclosureFind.mockResolvedValue({ ...disclosure, state: "PUBLISHED" });
  });

  it("allows withdrawal, never publication, through assistance-update permission", async () => {
    await expect(urgentlyWithdrawAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", withdrawalReason: "CONSENT_WITHDRAWN",
      consentReviewAttested: "",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("assistance.update");
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: "disclosure-synthetic", state: "PUBLISHED", updatedAt: version },
      data: { state: "WITHDRAWN" },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "content-reviewer",
      action: "assistance.anonymous_outcome_urgent_withdrawal",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: {
        disclosureId: "disclosure-synthetic",
        previousState: "PUBLISHED", reason: "CONSENT_WITHDRAWN",
      },
    } });
    expect(m.revalidate).toHaveBeenCalledWith("/impact");
  });

  it("does not authorize an assistance editor to approve or publish copy", async () => {
    await expect(urgentlyWithdrawAnonymousOutcomeCopy(form()))
      .rejects.toThrow("only revoke");
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("requires case-view permission and matching case ownership", async () => {
    m.has.mockReturnValue(false);
    await expect(urgentlyWithdrawAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", withdrawalReason: "CONSENT_WITHDRAWN",
    }))).rejects.toThrow("Case-view permission");
    expect(m.transaction).not.toHaveBeenCalled();
    m.has.mockReturnValue(true);
    m.disclosureFind.mockResolvedValue({
      ...disclosure, observation: { assistanceRequestId: "different-case" },
    });
    await expect(urgentlyWithdrawAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", withdrawalReason: "CONSENT_WITHDRAWN",
    }))).rejects.toThrow("does not belong");
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("does not invent copy-approval attribution for a withdrawn unreviewed draft", async () => {
    m.disclosureFind.mockResolvedValue({ ...disclosure, state: "DRAFT" });
    await expect(urgentlyWithdrawAnonymousOutcomeCopy(form({
      decision: "WITHDRAWN", withdrawalReason: "SOURCE_INVALIDATED",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: "disclosure-synthetic", state: "DRAFT", updatedAt: version },
      data: { state: "WITHDRAWN" },
    });
  });
});
