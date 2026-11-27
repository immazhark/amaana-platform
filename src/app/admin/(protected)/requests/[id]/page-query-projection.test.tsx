import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request, findMany: async () => [] }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerificationWithFeedback: vi.fn(), updateRequestWithFeedback: vi.fn() }));
import RequestDetailPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-operator" }); mocks.allowed.mockReturnValue(false);
  mocks.staff.mockResolvedValue([{ id: "synthetic-staff", name: "Synthetic staff" }]);
  mocks.history.mockResolvedValue([{ id: "synthetic-event", action: "synthetic_reviewed", createdAt: new Date("2026-10-26T12:00:00Z"), actor: { name: "Synthetic actor" } }]);
  mocks.request.mockResolvedValue({
    id: "synthetic-request", referenceNumber: "SYNTHETIC-REQUEST", applicantName: "Synthetic applicant", category: "OTHER", city: "Synthetic city",
    phone: "0000000000", email: "synthetic@example.invalid", description: "Synthetic private request", status: "UNDER_VERIFICATION", documents: [], appeal: null,
    assignedToId: "synthetic-staff", createdAt: new Date("2026-10-26T12:00:00Z"), updatedAt: new Date("2026-10-26T12:00:00Z"),
    verification: {
      decision: "APPROVED_PRIVATE", confidentialityLevel: "CONFIDENTIAL", completedAt: new Date("2026-10-26T12:00:00Z"), updatedAt: new Date("2026-10-26T12:00:00Z"), reviewedBy: { name: "Synthetic reviewer" },
      needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: null, approvedPublicTarget: null,
      publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED",
    },
  });
});
const render = async (search: Record<string, string | string[] | undefined> = {}) => renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }), searchParams: Promise.resolve(search) }));

it("loads only the current assignee name while preserving the selected staff ID", async () => {
  const html = await render();
  const query = mocks.request.mock.calls[0]?.[0];
  expect(query.where).toEqual({ id: "synthetic-request" });
  expect(query.include.assignedTo).toEqual({ select: { name: true } });
  expect(html).toContain('<option value="synthetic-staff" selected="">Synthetic staff</option>');
});
it("loads only staff choice identity without changing eligibility or ordering", async () => {
  await render();
  expect(mocks.staff.mock.calls[0]?.[0]).toEqual({
    where: { status: "ACTIVE", roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } } },
    orderBy: { name: "asc" }, select: { id: true, name: true },
  });
});
it("keeps the verification reviewer's name without other user columns", async () => {
  const html = await render();
  expect(mocks.request.mock.calls[0]?.[0].include.verification.include.reviewedBy).toEqual({ select: { name: true } });
  expect(html).toContain("by Synthetic reviewer.");
});
it("reads only the rendered audit history fields and actor name", async () => {
  const html = await render();
  expect(mocks.history.mock.calls[0]?.[0]).toEqual({
    where: { entityType: "AssistanceRequest", entityId: "synthetic-request" },
    select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 51,
  });
  expect(html).toContain("Synthetic actor");
  expect(html).toContain("synthetic reviewed");
});
it("stops before all reads when page access is denied", async () => {
  mocks.permission.mockRejectedValue(new Error("denied"));
  await expect(render()).rejects.toThrow("denied");
  expect(mocks.permission).toHaveBeenCalledWith("assistance.view");
  [mocks.request, mocks.staff, mocks.history].forEach(read => expect(read).not.toHaveBeenCalled());
});

it("loads only document list fields without private storage details", async () => {
  const html = await render();
  const query = mocks.request.mock.calls[0]?.[0];

  expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.view");
  expect(query.where).toEqual({ id: "synthetic-request" });
  expect(query.include.documents).toEqual({
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
  });
  expect(html).toContain("Private documents");
  expect(html).toContain("No documents were submitted.");
});

it("reads only linked Appeal identity, title and status for the private case view", async () => {
  const html = await render();
  expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.view");
  expect(mocks.request.mock.calls[0]?.[0].include.appeal).toEqual({
    select: { id: true, title: true, status: true },
  });
  expect(html).toContain("Request details");
});

it("bounds audit history without losing older changes, queue context or the review controls", async () => {
  const time = new Date("2026-10-26T12:00:00Z");
  const rows = Array.from({ length: 51 }, (_, i) => ({
    id: "event-" + String(51 - i).padStart(2, "0"),
    action: i === 50 ? "sentinel_not_rendered" : "recorded_change",
    createdAt: time, actor: { name: "Synthetic actor" },
  }));
  mocks.history.mockResolvedValueOnce(rows);
  const html = await render({ queueStatus: "UNDER_VERIFICATION", queuePage: "2", arbitrary: "PRIVATE_SYNTHETIC" });
  expect(html).toContain("Showing 50 most recent recorded changes");
  expect(html).not.toContain("sentinel not rendered");
  expect(html).toContain('historyBefore=2026-10-26T12%3A00%3A00.000Z~event-02#audit-history-heading');
  expect(html).toContain("queueStatus=UNDER_VERIFICATION");
  expect(html).toContain("queuePage=2");
  expect(html).not.toContain("PRIVATE_SYNTHETIC");
  expect(html).toContain("Older changes");
  expect(html).toContain("Review and decision");
  for (const id of ["request-details-heading", "private-documents-heading", "case-assignment-heading", "request-more-heading", "review-heading", "audit-history-heading", "assistance-workflow-guide"]) {
    expect(html).toContain('href="#' + id + '"');
    expect(html).toContain('id="' + id + '"');
  }
});

it("uses an exclusive timestamp and ID boundary for older events within the same case", async () => {
  const boundary = "2026-10-26T12:00:00.000Z~event-02";
  const html = await render({ historyBefore: boundary });
  expect(mocks.history.mock.calls[0]?.[0]).toMatchObject({
    where: { entityType: "AssistanceRequest", entityId: "synthetic-request", OR: [
      { createdAt: { lt: new Date("2026-10-26T12:00:00.000Z") } },
      { createdAt: new Date("2026-10-26T12:00:00.000Z"), id: { lt: "event-02" } },
    ] },
    take: 51,
  });
  expect(html).toContain("Newest changes");
  expect(html).toContain('href="/admin/requests/synthetic-request#audit-history-heading"');
});

it("keeps the reviewer workflow available if audit history fails and never claims there were no changes", async () => {
  mocks.history.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
  const html = await render();
  expect(html).toContain("Audit history temporarily unavailable");
  expect(html).not.toContain("No changes recorded yet.");
  expect(html).not.toContain("PRIVATE_SYNTHETIC_DIAGNOSTIC");
  expect(html).toContain("Review and decision");
  expect(mocks.log).toHaveBeenCalledExactlyOnceWith("assistance.case_history_unavailable");
  expect(mocks.request).toHaveBeenCalledOnce();
});

it("treats invalid or repeated history boundaries as the newest page and distinguishes an empty older page", async () => {
  await render({ historyBefore: ["2026-10-26T12:00:00.000Z~event-02", "invalid"] });
  expect(mocks.history.mock.calls[0]?.[0].where).toEqual({ entityType: "AssistanceRequest", entityId: "synthetic-request" });
  mocks.history.mockResolvedValueOnce([]);
  const html = await render({ historyBefore: "2026-10-26T12:00:00.000Z~event-02" });
  expect(html).toContain("No older changes on this page.");
  expect(html).not.toContain("No changes recorded yet.");
  expect(html).toContain("Newest changes");
});
