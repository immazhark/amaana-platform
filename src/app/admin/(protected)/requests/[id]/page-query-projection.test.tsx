import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerification: vi.fn(), updateRequest: vi.fn() }));
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

it("omits the unused assignee join while preserving the selected staff ID", async () => {
  const html = await render();
  const query = mocks.request.mock.calls[0]?.[0];
  expect(query.where).toEqual({ id: "synthetic-request" });
  expect(query.include).not.toHaveProperty("assignedTo");
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
