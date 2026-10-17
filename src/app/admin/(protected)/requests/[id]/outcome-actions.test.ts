import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(), has: vi.fn(),
  invalidate: vi.fn(), transaction: vi.fn(),
  existing: vi.fn(), active: vi.fn(), create: vi.fn(),
  update: vi.fn(), delivery: vi.fn(), evidenceCount: vi.fn(),
  audit: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(),
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
import { reportAssistanceOutcome, reviewAssistanceOutcome } from "./outcome-actions";

const version = new Date("2026-10-16T08:00:00.000Z");
const token = "afd34b87-03cf-453a-a87a-df31835f8d12";
const caseRecord = {
  status: "APPROVED", appealId: null,
  verification: { decision: "APPROVED_PRIVATE", completedAt: version },
};
const delivery = {
  assistanceRequestId: "case-synthetic", kind: "IN_KIND", state: "CONFIRMED",
  updatedAt: version, evidenceDocumentId: "delivery-proof",
  financialReconciliation: null, reportedById: "delivery-reporter",
  assistanceRequest: caseRecord,
};
const outcome = {
  id: "outcome-synthetic", assistanceRequestId: "case-synthetic",
  reportedById: "observation-reporter", state: "REPORTED",
  reviewedById: null, reviewedAt: null, updatedAt: version,
  deliveryRecord: delivery,
};
const tx = {
  assistanceOutcomeObservation: {
    findUnique: m.existing, findFirst: m.active,
    create: m.create, updateMany: m.update,
  },
  assistanceDeliveryRecord: { findUnique: m.delivery },
  assistanceDocument: { count: m.evidenceCount },
  auditEvent: { create: m.audit },
};
function form(change: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    id: "case-synthetic", deliveryRecordId: "delivery-synthetic",
    observationId: "outcome-synthetic", submissionId: token,
    kind: "PARTIAL_SUPPORT", state: "REVIEWED",
    summary: "The specific delivery provided some of the approved support.",
    limitedScopeAttested: "yes", evidenceAttested: "yes",
    expectedDeliveryUpdatedAt: version.toISOString(),
    expectedUpdatedAt: version.toISOString(), ...change,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ id: "independent-reviewer" });
  m.has.mockReturnValue(true);
  m.transaction.mockImplementation(async (cb: (db: typeof tx) => Promise<unknown>) => cb(tx));
  m.existing.mockResolvedValue(null);
  m.active.mockResolvedValue(null);
  m.delivery.mockResolvedValue(delivery);
  m.evidenceCount.mockResolvedValue(1);
  m.create.mockResolvedValue({ id: "outcome-synthetic" });
  m.update.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-synthetic" });
  m.redirect.mockImplementation(() => { throw new Error("NAVIGATE"); });
});

describe("private delivery-linked outcome reporting", () => {
  it("requires update and case-view permission before creating private observations", async () => {
    m.has.mockReturnValue(false);
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("Case-view permission");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("creates a single source-linked report with no public or payment side effects", async () => {
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("assistance.update");
    expect(m.evidenceCount).toHaveBeenCalledWith({
      where: {
        assistanceRequestId: "case-synthetic",
        id: { in: ["delivery-proof"] },
      },
    });
    expect(m.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assistanceRequestId: "case-synthetic", deliveryRecordId: "delivery-synthetic",
        submissionId: token, kind: "PARTIAL_SUPPORT",
        reportedById: "independent-reviewer",
      }),
      select: { id: true },
    });
    const metadata = m.audit.mock.calls[0]?.[0]?.data?.metadata;
    expect(metadata).toEqual({
      observationId: "outcome-synthetic",
      deliveryRecordId: "delivery-synthetic", kind: "PARTIAL_SUPPORT",
    });
    expect(JSON.stringify(metadata)).not.toContain("specific delivery provided");
  });
  it("does not duplicate a matching replay", async () => {
    m.existing.mockResolvedValue({
      assistanceRequestId: "case-synthetic",
      deliveryRecordId: "delivery-synthetic",
      kind: "PARTIAL_SUPPORT",
      summary: "The specific delivery provided some of the approved support.",
      reportedById: "independent-reviewer",
    });
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("NAVIGATE");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("rejects altered replay, invalid source and a second active observation", async () => {
    m.existing.mockResolvedValueOnce({
      assistanceRequestId: "another-case",
      deliveryRecordId: "delivery-synthetic", kind: "PARTIAL_SUPPORT",
      summary: "The specific delivery provided some of the approved support.",
      reportedById: "independent-reviewer",
    });
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("already used");
    m.delivery.mockResolvedValueOnce({ ...delivery, state: "VOIDED" });
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("independently reviewed delivery");
    m.active.mockResolvedValueOnce({ id: "active-outcome" });
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("already has an active");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("rejects a withdrawn approval or missing proof before writing", async () => {
    m.delivery.mockResolvedValueOnce({
      ...delivery, assistanceRequest: { ...caseRecord, status: "REJECTED" },
    });
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("independently reviewed delivery");
    m.evidenceCount.mockResolvedValueOnce(0);
    await expect(reportAssistanceOutcome(form())).rejects.toThrow("changed or deleted");
    expect(m.create).not.toHaveBeenCalled();
  });
});

describe("independent outcome review and audited correction", () => {
  beforeEach(() => { m.existing.mockResolvedValue(outcome); });

  it("requires approval permission and a separate case-view grant", async () => {
    m.has.mockReturnValue(false);
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("Case-view permission");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("confirms only current independently evidenced support, without public publication", async () => {
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("NAVIGATE");
    expect(m.auth).toHaveBeenCalledWith("assistance.approve");
    expect(m.update).toHaveBeenCalledWith({
      where: {
        id: "outcome-synthetic", assistanceRequestId: "case-synthetic",
        state: "REPORTED", updatedAt: version,
      },
      data: {
        state: "REVIEWED", reviewedById: "independent-reviewer",
        reviewedAt: expect.any(Date),
      },
    });
    expect(m.audit).toHaveBeenCalledWith({
      data: {
        actorId: "independent-reviewer", action: "assistance.outcome_observation_reviewed",
        entityType: "AssistanceRequest", entityId: "case-synthetic",
        metadata: {
          observationId: "outcome-synthetic",
          previousState: "REPORTED", state: "REVIEWED",
        },
      },
    });
  });
  it("forbids self-review by the reporter or underlying delivery reporter", async () => {
    m.auth.mockResolvedValueOnce({ id: "observation-reporter" });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("independent case reviewer");
    m.auth.mockResolvedValueOnce({ id: "delivery-reporter" });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("independent case reviewer");
    expect(m.update).not.toHaveBeenCalled();
  });
  it("blocks review after evidence disappears or delivery is voided", async () => {
    m.evidenceCount.mockResolvedValueOnce(0);
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("no longer available");
    m.existing.mockResolvedValueOnce({
      ...outcome, deliveryRecord: { ...delivery, state: "VOIDED" },
    });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("no longer eligible");
    expect(m.update).not.toHaveBeenCalled();
  });
  it("permits only the original outcome reviewer to retry a completed decision", async () => {
    m.existing.mockResolvedValue({ ...outcome, state: "REVIEWED",
      reviewedById: "different-approver", reviewedAt: version });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("another staff member");
    expect(m.update).not.toHaveBeenCalled();
    m.existing.mockResolvedValue({ ...outcome, state: "REVIEWED",
      reviewedById: "independent-reviewer", reviewedAt: version });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("NAVIGATE");
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("voids an already reviewed outcome while retaining original reviewer attribution", async () => {
    m.existing.mockResolvedValue({
      ...outcome, state: "REVIEWED",
      reviewedById: "first-reviewer", reviewedAt: version,
    });
    await expect(reviewAssistanceOutcome(form({ state: "VOIDED", evidenceAttested: "" })))
      .rejects.toThrow("NAVIGATE");
    expect(m.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          previousState: "REVIEWED", state: "VOIDED",
          previousReviewedById: "first-reviewer",
          previousReviewedAt: version.toISOString(),
        }),
      }),
    });
  });
  it("rejects stale review changes, with no duplicate audit event", async () => {
    m.existing.mockResolvedValue({
      ...outcome, updatedAt: new Date("2026-10-16T09:00:00Z"),
    });
    await expect(reviewAssistanceOutcome(form())).rejects.toThrow("Another reviewer changed");
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});
