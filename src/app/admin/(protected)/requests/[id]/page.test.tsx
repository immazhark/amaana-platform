import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn(), tasks: vi.fn(), deliveries: vi.fn(), missing: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("next/navigation", () => ({ notFound: m.missing }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: m.request }, user: { findMany: m.staff },
  auditEvent: { findMany: m.history }, assistanceFollowUp: { findMany: m.tasks },
  assistanceDeliveryRecord: { findMany: m.deliveries },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerification: vi.fn(), updateRequest: vi.fn() }));
vi.mock("./milestone-actions", () => ({ addPrivateMilestone: vi.fn(), redactPrivateMilestone: vi.fn() }));
vi.mock("./delivery-actions", () => ({ linkAssistanceDeliveryEvidence: vi.fn(), reportAssistanceDelivery: vi.fn(), reviewAssistanceDelivery: vi.fn() }));
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
  m.history.mockResolvedValue([]); m.tasks.mockResolvedValue([]); m.deliveries.mockResolvedValue([]);
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
  it("does not expose delivery review actions to view-only staff", async () => {
    const result = await render();
    expect(result).not.toContain("Record delivered support for review");
    expect(result).not.toContain("Confirm reviewed delivery evidence");
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
      appeal: { select: { title: true, status: true } },
      verification: { include: { reviewedBy: { select: { name: true } } } },
    });
    expect(result).toContain("Synthetic reviewer"); expect(result).toContain("Private case narrative");
    expect(result).toContain("Save assignment"); expect(result).toContain("disabled");
  });
});
