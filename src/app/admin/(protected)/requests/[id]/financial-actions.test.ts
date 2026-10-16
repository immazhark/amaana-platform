import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(), has: vi.fn(),
  invalidate: vi.fn(), tx: vi.fn(), reconcileFind: vi.fn(),
  deliveryFind: vi.fn(), proofFind: vi.fn(), proofCount: vi.fn(),
  reconcileCreate: vi.fn(), reconcileUpdate: vi.fn(), audit: vi.fn(),
  refresh: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth, hasPermission: m.has }));
vi.mock("@/lib/assistance-outcome-invalidation", () => ({
  withdrawStaleAnonymousOutcomeCopies: m.invalidate,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: m.tx }));
vi.mock("next/cache", () => ({ revalidatePath: m.refresh }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import {
  proposeAssistanceFinancialCorroboration,
  reviewAssistanceFinancialCorroboration,
} from "./financial-actions";

const version = new Date("2026-10-16T08:00:00.000Z");
const caseRecord = {
  status: "APPROVED", appealId: null,
  verification: { decision: "APPROVED_PRIVATE", completedAt: version },
};
const delivery = {
  assistanceRequestId: "case-synthetic",
  kind: "FINANCIAL", state: "CONFIRMED",
  amountInr: { toFixed: () => "1250.50" },
  updatedAt: version, evidenceDocumentId: "delivery-proof",
  assistanceRequest: caseRecord,
};
const review = {
  id: "recon-synthetic", status: "PENDING",
  submittedById: "maker-synthetic", reviewedById: null,
  reviewedAt: null, updatedAt: version,
  bankProofDocumentId: "bank-proof",
  deliveryRecord: {
    ...delivery, reportedById: "reporter-synthetic",
  },
};
const db = {
  assistanceFinancialReconciliation: {
    findUnique: m.reconcileFind, create: m.reconcileCreate,
    updateMany: m.reconcileUpdate,
  },
  assistanceDeliveryRecord: { findUnique: m.deliveryFind },
  assistanceDocument: { findFirst: m.proofFind, count: m.proofCount },
  auditEvent: { create: m.audit },
};
function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    id: "case-synthetic", deliveryRecordId: "delivery-synthetic",
    bankProofDocumentId: "bank-proof",
    transactionReference: "Bank123456789", amountInr: "1250.50",
    bankEvidenceAttested: "yes", expectedDeliveryUpdatedAt: version.toISOString(),
    reconciliationId: "recon-synthetic", expectedUpdatedAt: version.toISOString(),
    state: "EVIDENCE_REVIEWED", ...changes,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ id: "finance-synthetic" });
  m.has.mockReturnValue(true);
  m.tx.mockImplementation(async (fn: (value: typeof db) => Promise<unknown>) => fn(db));
  m.reconcileFind.mockResolvedValue(null);
  m.deliveryFind.mockResolvedValue(delivery);
  m.proofFind.mockResolvedValue({ id: "bank-proof" });
  m.proofCount.mockResolvedValue(2);
  m.reconcileCreate.mockResolvedValue({ id: "recon-synthetic" });
  m.reconcileUpdate.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-synthetic" });
  m.redirect.mockImplementation(() => { throw new Error("NAVIGATE"); });
});

describe("staff corroboration of confirmed financial delivery", () => {
  it("compares exact existing delivery money and stores only bank-reference evidence", async () => {
    await expect(proposeAssistanceFinancialCorroboration(form())).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("assistance.update");
    expect(m.proofFind).toHaveBeenCalledWith({
      where: { id: "bank-proof", assistanceRequestId: "case-synthetic" },
      select: { id: true },
    });
    expect(m.reconcileCreate).toHaveBeenCalledWith({
      data: {
        deliveryRecordId: "delivery-synthetic",
        transactionReference: "BANK123456789",
        bankProofDocumentId: "bank-proof",
        submittedById: "finance-synthetic",
      },
      select: { id: true },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "finance-synthetic",
      action: "assistance.financial_corroboration_proposed",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { reconciliationId: "recon-synthetic", deliveryRecordId: "delivery-synthetic" },
    } });
  });
  it("replays an identical proposal without creating a second financial reference", async () => {
    m.reconcileFind.mockResolvedValue({
      submittedById: "finance-synthetic",
      transactionReference: "BANK123456789",
      bankProofDocumentId: "bank-proof",
    });
    await expect(proposeAssistanceFinancialCorroboration(form())).rejects.toThrow("NAVIGATE");
    expect(m.deliveryFind).not.toHaveBeenCalled();
    expect(m.reconcileCreate).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("rejects reusing another case's external bank reference", async () => {
    m.reconcileFind.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "other-reconciliation" });
    await expect(proposeAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("already linked to another delivery");
    expect(m.deliveryFind).not.toHaveBeenCalled();
    expect(m.reconcileCreate).not.toHaveBeenCalled();
  });
  it("rejects an amount discrepancy before writing financial corroboration", async () => {
    await expect(proposeAssistanceFinancialCorroboration(form({ amountInr: "1250.40" })))
      .rejects.toThrow("does not match");
    expect(m.reconcileCreate).not.toHaveBeenCalled();
  });
  it("does not confuse donation allocations with confirmed financial delivery", async () => {
    m.deliveryFind.mockResolvedValue({ ...delivery, state: "REPORTED" });
    await expect(proposeAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("independently reviewed financial delivery");
    expect(m.proofFind).not.toHaveBeenCalled();
  });
  it("requires bank evidence to be separate from delivery proof and within the same case", async () => {
    await expect(proposeAssistanceFinancialCorroboration(form({ bankProofDocumentId: "delivery-proof" })))
      .rejects.toThrow("separate from delivery");
    m.proofFind.mockResolvedValue(null);
    await expect(proposeAssistanceFinancialCorroboration(form())).rejects.toThrow("same private assistance case");
    expect(m.reconcileCreate).not.toHaveBeenCalled();
  });
  it("blocks a withdrawn assistance approval before creating a match", async () => {
    m.deliveryFind.mockResolvedValue({
      ...delivery, assistanceRequest: { ...caseRecord, status: "REJECTED" },
    });
    await expect(proposeAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("currently approved");
    expect(m.reconcileCreate).not.toHaveBeenCalled();
  });
});

describe("segregated review of private bank-proof evidence", () => {
  beforeEach(() => { m.reconcileFind.mockResolvedValue(review); });

  it("requires a finance permission distinct from general case approval", async () => {
    await expect(reviewAssistanceFinancialCorroboration(form())).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("donation.reconcile");
    expect(m.reconcileUpdate).toHaveBeenCalledWith({
      where: {
        id: "recon-synthetic", status: "PENDING", updatedAt: version,
      },
      data: {
        status: "EVIDENCE_REVIEWED", reviewedById: "finance-synthetic",
        reviewedAt: expect.any(Date),
      },
    });
    expect(m.proofCount).toHaveBeenCalledWith({
      where: { assistanceRequestId: "case-synthetic",
        id: { in: ["delivery-proof", "bank-proof"] } },
    });
  });
  it("rejects both maker self-review and the original delivery reporter", async () => {
    m.auth.mockResolvedValue({ id: "maker-synthetic" });
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("independent finance reviewer");
    m.auth.mockResolvedValue({ id: "reporter-synthetic" });
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("independent finance reviewer");
    expect(m.reconcileUpdate).not.toHaveBeenCalled();
  });
  it("blocks a review if a private bank or delivery document is missing", async () => {
    m.proofCount.mockResolvedValue(1);
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("Both private delivery evidence");
    expect(m.reconcileUpdate).not.toHaveBeenCalled();
  });
  it("blocks confirmation after case reversal or delivery invalidation", async () => {
    m.reconcileFind.mockResolvedValue({
      ...review, deliveryRecord: {
        ...review.deliveryRecord, state: "VOIDED",
      },
    });
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("no longer eligible");
    expect(m.reconcileUpdate).not.toHaveBeenCalled();
  });
  it("records a void correction while retaining historical reviewer attribution", async () => {
    m.reconcileFind.mockResolvedValue({
      ...review, status: "EVIDENCE_REVIEWED",
      reviewedById: "earlier-finance-reviewer", reviewedAt: version,
    });
    await expect(reviewAssistanceFinancialCorroboration(form({
      state: "VOIDED", bankEvidenceAttested: "",
    }))).rejects.toThrow("NAVIGATE");
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: "assistance.financial_corroboration_reviewed",
      metadata: expect.objectContaining({
        previousStatus: "EVIDENCE_REVIEWED", status: "VOIDED",
        previousReviewedById: "earlier-finance-reviewer",
      }),
    }) });
  });
  it("rejects stale writes and leaves the bank evidence history unmodified", async () => {
    m.reconcileFind.mockResolvedValue({ ...review,
      updatedAt: new Date("2026-10-16T09:00:00.000Z") });
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("reviewer changed");
    expect(m.reconcileUpdate).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("rejects missing case-view authorization before reading bank evidence", async () => {
    m.has.mockReturnValue(false);
    await expect(reviewAssistanceFinancialCorroboration(form()))
      .rejects.toThrow("Case-view permission");
    expect(m.tx).not.toHaveBeenCalled();
  });
});
