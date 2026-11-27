import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn(), dupes: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request, findMany: mocks.dupes }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history },
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
const render = async () => renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));

it("flags other requests sharing a phone or email as a prompt for judgement, not a finding", async () => {
  mocks.dupes.mockResolvedValue([{ id: "other-request", referenceNumber: "AF-2026-111111", status: "REJECTED", createdAt: new Date("2026-10-01T00:00:00Z") }]);
  const html = await render();
  expect(html).toContain("Possible duplicates");
  expect(html).toContain("not proof");
  expect(html).toContain("AF-2026-111111");
  const query = mocks.dupes.mock.calls[0]?.[0];
  expect(query.where.id).toEqual({ not: "synthetic-request" });
  expect(query.take).toBe(5);
});

it("shows nothing when no other request shares the contact details", async () => {
  mocks.dupes.mockResolvedValue([]);
  expect(await render()).not.toContain("Possible duplicates");
});

it("returns to the same validated queue and preserves context on related case links", async () => {
  mocks.dupes.mockResolvedValue([{ id: "other-request", referenceNumber: "AF-2026-111111", status: "REJECTED", createdAt: new Date("2026-10-01T00:00:00Z") }]);
  const html = renderToStaticMarkup(await RequestDetailPage({
    params: Promise.resolve({ id: "synthetic-request" }),
    searchParams: Promise.resolve({ queueStatus: "SUBMITTED", queueView: "tests", queuePage: "2", queueSort: "oldest", queueAssignment: "mine", queueCategory: "MEDICAL", returnTo: "https://outside.example" }),
  }));
  expect(html).toContain('href="/admin?status=SUBMITTED&amp;view=tests&amp;page=2&amp;sort=oldest&amp;assignment=mine&amp;category=MEDICAL"');
  expect(html).toContain('href="/admin/requests/other-request?queueStatus=SUBMITTED&amp;queueView=tests&amp;queuePage=2&amp;queueSort=oldest&amp;queueAssignment=mine&amp;queueCategory=MEDICAL"');
  expect(html).not.toContain("https://outside.example");
});
