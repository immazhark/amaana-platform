import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn(), tasks: vi.fn(), deliveries: vi.fn(), outcomes: vi.fn(), missing: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("next/navigation", () => ({ notFound: m.missing, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: m.request }, user: { findMany: m.staff },
  auditEvent: { findMany: m.history }, assistanceFollowUp: { findMany: m.tasks },
  assistanceDeliveryRecord: { findMany: m.deliveries },
  assistanceOutcomeObservation: { findMany: m.outcomes },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerification: vi.fn(), updateRequest: vi.fn() }));
vi.mock("./milestone-actions", () => ({ addPrivateMilestone: vi.fn(), redactPrivateMilestone: vi.fn() }));
vi.mock("./delivery-actions", () => ({ linkAssistanceDeliveryEvidence: vi.fn(), reportAssistanceDelivery: vi.fn(), reviewAssistanceDelivery: vi.fn() }));
vi.mock("./outcome-actions", () => ({ reportAssistanceOutcome: vi.fn(), reviewAssistanceOutcome: vi.fn() }));
vi.mock("./disclosure-actions", () => ({
  proposeAnonymousOutcomeCopy: vi.fn(), reviewAnonymousOutcomeCopy: vi.fn(),
  publishAnonymousOutcomeCopy: vi.fn(), reconcileAnonymousOutcomeDisclosures: vi.fn(),
  urgentlyWithdrawAnonymousOutcomeCopy: vi.fn(),
}));
vi.mock("./financial-actions", () => ({
  proposeAssistanceFinancialCorroboration: vi.fn(), reviewAssistanceFinancialCorroboration: vi.fn(),
}));
vi.mock("./follow-up-actions", () => ({
  createAssistanceFollowUp: vi.fn(), resolveAssistanceFollowUp: vi.fn(),
  rescheduleAssistanceFollowUp: vi.fn(), assignAssistanceFollowUp: vi.fn(),
}));
import RequestDetailPage from "./page";
const render = async () => renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "case-synthetic" }) }));
beforeEach(() => {
  vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "viewer" }); m.has.mockReturnValue(false);
  m.request.mockResolvedValue({
    id: "case-synthetic", referenceNumber: "AF-SYNTHETIC", applicantName: "Synthetic applicant", category: "MEDICAL", city: "Hyderabad",
    status: "SUBMITTED", createdAt: new Date("2026-10-15T00:00:00Z"), updatedAt: new Date("2026-10-15T00:00:00Z"),
    phone: "synthetic-contact", email: null, description: "Private case narrative", documents: [], verification: null, appeal: null, appealId: null,
  });
  m.staff.mockResolvedValue([{ id: "reviewer", name: "Synthetic reviewer" }]);
  m.history.mockResolvedValue([]); m.tasks.mockResolvedValue([]); m.deliveries.mockResolvedValue([]); m.outcomes.mockResolvedValue([]);
});
describe("private assistance detail projections", () => {
  it("enforces view permission before any case, staff or history read", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(render()).rejects.toThrow("Forbidden");
    expect(m.request).not.toHaveBeenCalled(); expect(m.staff).not.toHaveBeenCalled(); expect(m.history).not.toHaveBeenCalled();
  });
  it("shows authorized private milestones only on the protected case detail", async () => {
    m.has.mockReturnValue(true);
    m.history.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      id: "private-note-synthetic", action: "assistance.private_milestone_added",
      metadata: { kind: "DOCUMENT_FOLLOW_UP", summary: "Documents were requested for an internal second review." },
      createdAt: new Date("2026-10-16T08:00:00Z"),
      actor: { name: "Synthetic reviewer" },
    }]);
    const markup = await render();
    expect(markup).toContain("Private case follow-ups");
    expect(markup).toContain("Record private follow-up");
    expect(markup).toContain("Documents were requested for an internal second review.");
    expect(m.history).toHaveBeenCalledWith(expect.objectContaining({
      where: { entityType: "AssistanceRequest", entityId: "case-synthetic",
        action: { in: ["assistance.private_milestone_added", "assistance.private_milestone_redacted"] } },
      take: 60,
    }));
  });

  it("hides private notes after a valid redaction while retaining the audit trail", async () => {
    m.has.mockReturnValue(true);
    m.history.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      id: "redaction-1", action: "assistance.private_milestone_redacted",
      metadata: { targetId: "private-note" },
      createdAt: new Date("2026-10-16T09:00:00Z"),
      actor: { name: "Approver" },
    }, {
      id: "private-note", action: "assistance.private_milestone_added",
      metadata: { kind: "CONTACT_ATTEMPT", summary: "This sensitive follow-up should no longer appear." },
      createdAt: new Date("2026-10-16T08:00:00Z"),
      actor: { name: "Reviewer" },
    }]);
    const markup = await render();
    expect(markup).not.toContain("This sensitive follow-up should no longer appear.");
    expect(markup).toContain("No private follow-ups have been recorded.");
  });

  it("does not surface free-text notes from malformed historical audit metadata", async () => {
    m.history.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      id: "invalid-note", metadata: { kind: "PUBLIC_APPROVAL", summary: "Unreviewed disclosure must remain private." },
      createdAt: new Date("2026-10-16T08:00:00Z"), actor: { name: "Synthetic reviewer" },
    }]);
    const markup = await render();
    expect(markup).not.toContain("Unreviewed disclosure must remain private.");
    expect(markup).toContain("No private follow-ups have been recorded");
  });

  it("renders a private due-date task and approver-only cancellation control", async () => {
    m.has.mockReturnValue(true);
    m.tasks.mockResolvedValueOnce([{
      id: "task-synthetic", summary: "Call the referral institution about the pending case.",
      state: "OPEN", dueOn: new Date("2026-10-20T00:00:00Z"),
      createdAt: new Date("2026-10-16T00:00:00Z"),
      updatedAt: new Date("2026-10-16T00:00:00Z"), createdBy: { name: "Reviewer" },
      assignedToId: "viewer", assignedTo: { name: "Synthetic reviewer" },
    }]).mockResolvedValueOnce([]);
    const result = await render();
    expect(result).toContain("Next private follow-up actions");
    expect(result).toContain("Call the referral institution about the pending case.");
    expect(result).toContain("Mark action completed");
    expect(result).toContain("Cancel this action");
    expect(result).toContain("Responsible: Synthetic reviewer");
    expect(result).toContain("Transfer responsibility");
    expect(m.tasks).toHaveBeenCalledTimes(2);
  });
  it("does not expose task actions to view-only staff", async () => {
    const result = await render();
    expect(result).toContain("No open follow-up tasks");
    expect(result).not.toContain("Schedule private follow-up");
    expect(result).not.toContain("Mark action completed");
  });
  it("keeps reported delivery evidence restricted to the authorized case screen", async () => {
    m.has.mockReturnValue(true);
    m.deliveries.mockResolvedValue([{
      id: "delivery-one", kind: "IN_KIND", state: "REPORTED",
      summary: "Clothing and essential items reportedly supplied to the household.",
      occurredOn: new Date("2026-10-15T00:00:00Z"), amountInr: null,
      evidenceDocumentId: null, updatedAt: new Date("2026-10-16T00:00:00Z"),
      reportedById: "different-staff", reportedBy: { name: "Synthetic reviewer" },
      reviewedBy: null, reviewedAt: null,
    }]);
    const result = await render();
    expect(result).toContain("Private support-delivery evidence");
    expect(result).toContain("Delivery reported");
    expect(result).toContain("No currently linked private document");
    expect(result).toContain("Void erroneous delivery record");
    expect(result).not.toContain("Confirm reviewed delivery evidence");
    expect(m.deliveries).toHaveBeenCalledWith(expect.objectContaining({
      where: { assistanceRequestId: "case-synthetic" }, take: 30,
    }));
  });
  it("requires an explicit attestation and an eligible case to offer delivery confirmation", async () => {
    m.has.mockReturnValue(true);
    const request = {
      id: "case-synthetic", referenceNumber: "AF-SYNTHETIC", applicantName: "Synthetic applicant",
      category: "MEDICAL", city: "Hyderabad", status: "APPROVED",
      createdAt: new Date("2026-10-15T00:00:00Z"), updatedAt: new Date("2026-10-16T00:00:00Z"),
      phone: "synthetic-contact", email: null, description: "Private case narrative",
      documents: [{ id: "delivery-proof", originalName: "delivery.pdf", mimeType: "application/pdf", sizeBytes: 100 }],
      verification: { decision: "APPROVED_PRIVATE", completedAt: new Date("2026-10-15T10:00:00Z"),
        confidentialityLevel: "RESTRICTED", updatedAt: new Date("2026-10-15T10:00:00Z"),
        reviewedBy: { name: "Independent approver" } }, appeal: null, appealId: null,
    };
    m.request.mockResolvedValue(request);
    m.deliveries.mockResolvedValue([{ id: "delivery-one", kind: "IN_KIND", state: "REPORTED",
      summary: "Essential goods reportedly delivered with private evidence.",
      occurredOn: new Date("2026-10-15T00:00:00Z"), amountInr: null,
      evidenceDocumentId: "delivery-proof", updatedAt: new Date("2026-10-16T00:00:00Z"),
      reportedById: "original-reporter", reportedBy: { name: "Original reporter" },
      reviewedBy: null, reviewedAt: null,
    }]);
    const ready = await render();
    expect(ready).toContain("Confirm reviewed delivery evidence");
    expect(ready).toContain('name="evidenceAttested"');
    expect(ready).toContain("I personally reviewed the linked private evidence");
    m.request.mockResolvedValue({ ...request, status: "REJECTED" });
    const invalid = await render();
    expect(invalid).not.toContain("Confirm reviewed delivery evidence");
    expect(invalid).toContain("Void erroneous delivery record");
  });
  it("does not expose delivery review actions to view-only staff", async () => {
    const result = await render();
    expect(result).not.toContain("Record delivered support for review");
    expect(result).not.toContain("Confirm reviewed delivery evidence");
  });

  it("masks a finance reference from ordinary case viewers and preserves historical evidence status", async () => {
    m.deliveries.mockResolvedValue([{
      id: "delivery-finance", kind: "FINANCIAL", state: "CONFIRMED",
      summary: "Previously reviewed assistance delivered to a verified institution.",
      occurredOn: new Date("2026-10-15T00:00:00Z"),
      amountInr: { toFixed: () => "1250.50" },
      evidenceDocumentId: "delivery-proof", updatedAt: new Date("2026-10-16T00:00:00Z"),
      reportedById: "reporter-synthetic", reportedBy: { name: "Reporter" },
      reviewedBy: { name: "Independent reviewer" }, reviewedAt: new Date(),
      financialReconciliation: {
        id: "reconciliation-synthetic", status: "EVIDENCE_REVIEWED",
        transactionReference: "ABCD12345678", bankProofDocumentId: null,
        submittedById: "maker-synthetic",
        reviewedAt: new Date(), reviewedBy: { name: "Finance reviewer" },
        updatedAt: new Date(),
      },
    }]);
    const markup = await render();
    expect(markup).toContain("••••5678");
    expect(markup).not.toContain("ABCD12345678");
    expect(markup).toContain("historical review information only");
    expect(markup).not.toContain("Record independent bank-proof review");
  });

  it("renders controlled finance review with a separate bank document", async () => {
    m.has.mockReturnValue(true);
    m.deliveries.mockResolvedValue([{
      id: "delivery-finance", kind: "FINANCIAL", state: "CONFIRMED",
      summary: "Previously reviewed assistance delivered to a verified institution.",
      occurredOn: new Date("2026-10-15T00:00:00Z"),
      amountInr: { toFixed: () => "1250.50" },
      evidenceDocumentId: "delivery-proof", updatedAt: new Date("2026-10-16T00:00:00Z"),
      reportedById: "reporter-synthetic", reportedBy: { name: "Reporter" },
      reviewedBy: { name: "Independent reviewer" }, reviewedAt: new Date(),
      financialReconciliation: {
        id: "reconciliation-synthetic", status: "PENDING",
        transactionReference: "ABCD12345678", bankProofDocumentId: "bank-proof",
        submittedById: "maker-synthetic", reviewedAt: null, reviewedBy: null,
        updatedAt: new Date("2026-10-16T00:00:00Z"),
      },
    }]);
    const approvedRequest = {
      id: "case-synthetic", referenceNumber: "AF-SYNTHETIC",
      applicantName: "Synthetic applicant", category: "MEDICAL", city: "Hyderabad",
      status: "APPROVED", createdAt: new Date(), updatedAt: new Date(),
      phone: "synthetic-contact", email: null, description: "Private case narrative",
      documents: [
        { id: "delivery-proof", originalName: "delivery.pdf", mimeType: "application/pdf", sizeBytes: 100 },
        { id: "bank-proof", originalName: "bank.pdf", mimeType: "application/pdf", sizeBytes: 100 },
      ],
      verification: {
        decision: "APPROVED_PRIVATE", completedAt: new Date("2026-10-15T10:00:00Z"),
        updatedAt: new Date("2026-10-15T10:00:00Z"), reviewedBy: { name: "Independent approver" },
      }, appeal: null, appealId: null,
    };
    m.request.mockResolvedValue(approvedRequest);
    const markup = await render();
    expect(markup).toContain("ABCD12345678");
    expect(markup).toContain("Record independent bank-proof review");
    expect(markup).toContain("INR 1250.50");
    expect(markup).toContain("Void incorrect bank-proof match");
    // Bank-proof review becomes unavailable when private-case eligibility is revoked.
    m.request.mockResolvedValue({ ...approvedRequest, status: "REJECTED" });
    const blocked = await render();
    expect(blocked).not.toContain("Record independent bank-proof review");
    expect(blocked).toContain("Void incorrect bank-proof match");
  });

  it("hides outcome actions from case viewers without assistance-update authority", async () => {
    const markup = await render();
    expect(markup).toContain("Private case-outcome observations");
    expect(markup).toContain("No private outcome observations");
    expect(markup).not.toContain("Submit private outcome for independent review");
    expect(markup).not.toContain("Review private operational outcome");
    expect(m.outcomes).toHaveBeenCalledWith(expect.objectContaining({
      where: { assistanceRequestId: "case-synthetic" }, take: 30,
    }));
  });

  it("marks reviewed outcomes as historical when source evidence disappears", async () => {
    m.outcomes.mockResolvedValue([{
      id: "outcome-one", kind: "SPECIFIC_SUPPORT_COMPLETED", state: "REVIEWED",
      summary: "The specific support action was completed according to the record.",
      deliveryRecordId: "delivery-one", reportedById: "reporter",
      updatedAt: new Date("2026-10-16T09:00:00Z"),
      createdAt: new Date("2026-10-16T08:00:00Z"),
      reviewedAt: new Date("2026-10-16T10:00:00Z"),
      reportedBy: { name: "Reporter" }, reviewedBy: { name: "Reviewer" },
      deliveryRecord: {
        kind: "IN_KIND", state: "VOIDED", reportedById: "reporter",
        evidenceDocumentId: null, financialReconciliation: null,
      },
    }]);
    const markup = await render();
    expect(markup).toContain("historical internal review");
    expect(markup).toContain("no longer");
    expect(markup).not.toContain("Review private operational outcome");
    expect(markup).not.toContain("Submit private outcome for independent review");
  });

  it("retains withdrawal control after an earlier approved copy loses source eligibility", async () => {
    m.has.mockReturnValue(true);
    m.outcomes.mockResolvedValue([{
      id: "outcome-one", kind: "PARTIAL_SUPPORT", state: "VOIDED",
      summary: "This private note must not be presented as public impact.",
      deliveryRecordId: "delivery-one", reportedById: "another-reporter",
      reviewedById: "another-reviewer",
      updatedAt: new Date("2026-10-16T09:00:00Z"),
      createdAt: new Date("2026-10-16T08:00:00Z"),
      reviewedAt: new Date("2026-10-16T10:00:00Z"),
      reportedBy: { name: "Reporter" }, reviewedBy: { name: "Reviewer" },
      deliveryRecord: {
        kind: "IN_KIND", state: "VOIDED",
        reportedById: "delivery-reporter", evidenceDocumentId: null,
        financialReconciliation: null,
      },
      disclosure: {
        id: "disclosure-one", state: "APPROVED_COPY",
        copyText: "Amaana Foundation recorded partial support for a verified assistance case. Additional needs may remain.",
        consentDocumentId: "expired-consent", preparedById: "original-preparer",
        approvedBy: { name: "First approver" },
        approvedAt: new Date("2026-10-16T10:30:00Z"),
        updatedAt: new Date("2026-10-16T10:30:00Z"),
      },
    }]);
    const markup = await render();
    expect(markup).toContain("Anonymous copy approved internally");
    expect(markup).toContain("historical, not current");
    expect(markup).toContain("Withdraw anonymous-copy approval");
    expect(markup).not.toContain("Approve anonymous copy internally");
  });

  it("offers a private consent workflow only for a reviewed, STANDARD-confidentiality source", async () => {
    m.has.mockReturnValue(true);
    m.request.mockResolvedValue({
      id: "case-synthetic", referenceNumber: "AF-SYNTHETIC", applicantName: "Synthetic applicant",
      category: "MEDICAL", city: "Hyderabad", status: "APPROVED",
      createdAt: new Date("2026-10-15T00:00:00Z"),
      updatedAt: new Date("2026-10-16T00:00:00Z"),
      phone: "synthetic-contact", email: null, description: "Private case narrative",
      documents: [
        { id: "delivery-proof", originalName: "evidence.pdf",
          mimeType: "application/pdf", sizeBytes: 1024 },
        { id: "copy-consent", originalName: "signed-consent.pdf",
          mimeType: "application/pdf", sizeBytes: 1024 },
      ],
      verification: {
        status: "APPROVED", decision: "APPROVED_PRIVATE",
        completedAt: new Date("2026-10-15T10:00:00Z"),
        confidentialityLevel: "STANDARD",
        reviewedBy: { name: "Case approver" },
        publicNameConsent: "NOT_ALLOWED",
        photoConsent: "NOT_ALLOWED", medicalDetailsConsent: "NOT_ALLOWED",
        institutionNameConsent: "NOT_ALLOWED", archiveConsent: "UNCONFIRMED",
        updatedAt: new Date("2026-10-15T10:00:00Z"),
      },
      appeal: null, appealId: null,
    });
    m.outcomes.mockResolvedValue([{
      id: "outcome-one", kind: "PARTIAL_SUPPORT", state: "REVIEWED",
      summary: "Private supporting information must not appear in public copy.",
      deliveryRecordId: "delivery-one", reportedById: "reporter",
      reviewedById: "different-outcome-reviewer",
      updatedAt: new Date("2026-10-16T08:00:00Z"),
      createdAt: new Date("2026-10-16T08:00:00Z"),
      reviewedAt: new Date("2026-10-16T09:00:00Z"),
      reportedBy: { name: "Reporter" }, reviewedBy: { name: "Reviewer" },
      deliveryRecord: {
        kind: "IN_KIND", state: "CONFIRMED",
        reportedById: "reporter", evidenceDocumentId: "delivery-proof",
        financialReconciliation: null,
      },
      disclosure: null,
    }]);
    const markup = await render();
    expect(markup).toContain("Upload signed consent for the exact anonymous wording");
    expect(markup).toContain("Submit anonymous wording for independent approval");
    expect(markup).toContain("copy-consent");
    expect(markup).toContain("not a general intake consent");
    expect(markup).not.toContain("Approve anonymous copy internally");
    expect(markup).not.toContain("Private supporting information must not appear in public copy.</blockquote>");
  });

  it("does not create disclosure publication controls for an unreviewed outcome", async () => {
    m.outcomes.mockResolvedValue([{
      id: "outcome-reported", kind: "PARTIAL_SUPPORT", state: "REPORTED",
      summary: "Internal report awaiting review, not suitable for public disclosure.",
      deliveryRecordId: "delivery-one", reportedById: "other-reporter",
      updatedAt: new Date(), createdAt: new Date(), reviewedAt: null,
      reportedBy: { name: "Reporter" }, reviewedBy: null,
      deliveryRecord: {
        kind: "IN_KIND", state: "REPORTED",
        reportedById: "other-reporter", evidenceDocumentId: null,
        financialReconciliation: null,
      }, disclosure: null,
    }]);
    const markup = await render();
    expect(markup).not.toContain("Submit anonymous wording for independent approval");
    expect(markup).not.toContain("Approve anonymous copy internally");
  });

  it("fetches only staff names/IDs and never full authentication profiles or audit metadata", async () => {
    const result = await render();
    expect(m.permission).toHaveBeenCalledWith("assistance.view");
    expect(m.staff).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, name: true }, orderBy: [{ name: "asc" }, { id: "asc" }],
    }));
    expect(m.history).toHaveBeenCalledWith(expect.objectContaining({
      where: { entityType: "AssistanceRequest", entityId: "case-synthetic" },
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
      take: 50,
    }));
    expect(m.request.mock.calls[0]?.[0].include).toEqual({
      documents: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
      appeal: { select: { id: true, title: true, status: true, updatedAt: true } },
      verification: { include: { reviewedBy: { select: { name: true } } } },
    });
    expect(result).toContain("Synthetic reviewer"); expect(result).toContain("Private case narrative");
    expect(result).toContain("Save assignment"); expect(result).toContain("disabled");
  });
});
