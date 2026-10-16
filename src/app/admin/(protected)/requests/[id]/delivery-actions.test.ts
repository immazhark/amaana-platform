import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  permission: vi.fn(), transaction: vi.fn(), request: vi.fn(), document: vi.fn(),
  record: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn(), cache: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: m.transaction }));
vi.mock("next/cache", () => ({ revalidatePath: m.cache }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import { linkAssistanceDeliveryEvidence, reportAssistanceDelivery, reviewAssistanceDelivery } from "./delivery-actions";

const version = new Date("2026-10-16T08:00:00.000Z");
const uid = "ac637580-d949-4c62-9d98-d97c4768425e";
const form = (changes: Record<string, string> = {}) => {
  const data = new FormData();
  Object.entries({
    id: "case-synthetic", submissionId: uid, kind: "FINANCIAL",
    summary: "Medical support reportedly provided directly to a verified institution.",
    occurredOn: "2026-10-15", amountInr: "1250.00",
    evidenceDocumentId: "private-proof", expectedUpdatedAt: version.toISOString(),
    recordId: "delivery-synthetic", state: "CONFIRMED",
    expectedRecordUpdatedAt: version.toISOString(),
    ...changes,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
};
const tx = {
  assistanceRequest: { findUnique: m.request },
  assistanceDocument: { findFirst: m.document },
  assistanceDeliveryRecord: {
    findUnique: m.record, create: m.create, updateMany: m.update,
  },
  auditEvent: { create: m.audit },
};
beforeEach(() => {
  vi.resetAllMocks();
  m.permission.mockResolvedValue({ id: "approver-1" });
  m.transaction.mockImplementation(async (fn: (value: typeof tx) => Promise<void>) => fn(tx));
  m.request.mockResolvedValue({
    id: "case-synthetic", status: "APPROVED", appealId: null, updatedAt: version,
    verification: { decision: "APPROVED_PRIVATE", completedAt: version },
  });
  m.document.mockResolvedValue({ id: "private-proof" });
  m.record.mockResolvedValue(null);
  m.create.mockResolvedValue({ id: "delivery-synthetic" });
  m.update.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-1" });
  m.redirect.mockImplementation(() => { throw new Error("NAVIGATE"); });
});

describe("private delivery reporting and independent evidence confirmation", () => {
  it("records a report without affecting payment, appeal or published impact", async () => {
    await expect(reportAssistanceDelivery(form())).rejects.toThrow("NAVIGATE");
    expect(m.permission).toHaveBeenCalledWith("assistance.update");
    expect(m.document).toHaveBeenCalledWith({
      where: { id: "private-proof", assistanceRequestId: "case-synthetic" },
      select: { id: true },
    });
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      assistanceRequestId: "case-synthetic", submissionId: uid,
      amountInr: "1250.00", reportedById: "approver-1",
    }), select: { id: true } });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "approver-1", action: "assistance.delivery_reported",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { deliveryRecordId: "delivery-synthetic", kind: "FINANCIAL", evidenceLinked: true },
    } });
  });
  it("rejects mismatched case evidence before any delivery write", async () => {
    m.document.mockResolvedValue(null);
    await expect(reportAssistanceDelivery(form())).rejects.toThrow("does not belong");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("does not invent delivery evidence from an unverified case", async () => {
    m.request.mockResolvedValue({ id: "case-synthetic", status: "REJECTED",
      appealId: null, updatedAt: version, verification: null });
    await expect(reportAssistanceDelivery(form())).rejects.toThrow("approved");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("rejects a stale case change", async () => {
    m.request.mockResolvedValue({ id: "case-synthetic", status: "APPROVED", appealId: null,
      updatedAt: new Date("2026-10-16T09:00:00.000Z"),
      verification: { decision: "APPROVED_PRIVATE", completedAt: version } });
    await expect(reportAssistanceDelivery(form())).rejects.toThrow("case changed");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("requires a different approver and documentary evidence before confirmation", async () => {
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "approver-1", state: "REPORTED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("independent approver");
    expect(m.update).not.toHaveBeenCalled();
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "original-reviewer", state: "REPORTED",
      evidenceDocumentId: null, updatedAt: version });
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("Attach private evidence");
    expect(m.update).not.toHaveBeenCalled();
  });
  it("confirms valid evidence using a version-checked independent review", async () => {
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "original-reviewer", state: "REPORTED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("NAVIGATE");
    expect(m.permission).toHaveBeenCalledWith("assistance.approve");
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "delivery-synthetic", assistanceRequestId: "case-synthetic",
        state: "REPORTED", updatedAt: version },
      data: { state: "CONFIRMED", reviewedById: "approver-1", reviewedAt: expect.any(Date) },
    });
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "approver-1", action: "assistance.delivery_reviewed",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { deliveryRecordId: "delivery-synthetic", previousState: "REPORTED", state: "CONFIRMED" },
    } });
  });
  it("supports correction through a private void without erasing history", async () => {
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "original-reviewer", state: "CONFIRMED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(reviewAssistanceDelivery(form({ state: "VOIDED" }))).rejects.toThrow("NAVIGATE");
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { state: "VOIDED", reviewedById: "approver-1", reviewedAt: expect.any(Date) },
    }));
  });
  it("does not review another case or duplicate a confirmed review", async () => {
    m.record.mockResolvedValue({ assistanceRequestId: "another-case",
      reportedById: "original-reviewer", state: "REPORTED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("does not belong");
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "original-reviewer", state: "CONFIRMED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("NAVIGATE");
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("permits the reporter to link late-arriving same-case evidence exactly once", async () => {
    m.record.mockResolvedValue({
      assistanceRequestId: "case-synthetic", reportedById: "approver-1",
      state: "REPORTED", evidenceDocumentId: null, updatedAt: version,
    });
    const input = form();
    await expect(linkAssistanceDeliveryEvidence(input)).rejects.toThrow("NAVIGATE");
    expect(m.document).toHaveBeenCalledWith({
      where: { id: "private-proof", assistanceRequestId: "case-synthetic" },
      select: { id: true },
    });
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        assistanceRequestId: "case-synthetic", state: "REPORTED",
        evidenceDocumentId: null, updatedAt: version,
      }),
      data: { evidenceDocumentId: "private-proof" },
    }));
    expect(m.audit).toHaveBeenCalledWith({ data: {
      actorId: "approver-1", action: "assistance.delivery_evidence_linked",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { deliveryRecordId: "delivery-synthetic", evidenceLinked: true },
    } });
  });
  it("rejects post-review proof replacement and other reporters' attachments", async () => {
    const data = form();
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "other-staff", state: "REPORTED",
      evidenceDocumentId: null, updatedAt: version });
    await expect(linkAssistanceDeliveryEvidence(data)).rejects.toThrow("reporting staff member");
    m.record.mockResolvedValue({ assistanceRequestId: "case-synthetic",
      reportedById: "approver-1", state: "CONFIRMED",
      evidenceDocumentId: "private-proof", updatedAt: version });
    await expect(linkAssistanceDeliveryEvidence(data)).rejects.toThrow("cannot be changed");
    expect(m.update).not.toHaveBeenCalled();
  });

  it("denies access before private DB queries when permission is missing", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(reviewAssistanceDelivery(form())).rejects.toThrow("Forbidden");
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
