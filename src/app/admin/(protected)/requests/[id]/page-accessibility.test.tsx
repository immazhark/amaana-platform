import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerificationWithFeedback: vi.fn(), updateRequestWithFeedback: vi.fn() }));
import RequestDetailPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-operator" }); mocks.allowed.mockReturnValue(false);
  mocks.staff.mockResolvedValue([{ id: "synthetic-staff", name: "Synthetic staff" }]);
  mocks.history.mockResolvedValue([{ id: "synthetic-event", action: "synthetic_reviewed", createdAt: new Date("2026-10-28T20:00:00Z"), actor: { name: "Synthetic actor" } }]);
  mocks.request.mockResolvedValue({
    id: "synthetic-request", referenceNumber: "SYNTHETIC-REQUEST", applicantName: "Synthetic applicant", category: "OTHER", city: "Synthetic city",
    phone: "0000000000", email: "synthetic@example.invalid", description: "Synthetic private request", status: "UNDER_VERIFICATION", documents: [{ id: "synthetic-document", originalName: "Synthetic evidence.pdf", mimeType: "application/pdf", sizeBytes: 1000 }], appeal: null,
    assignedToId: "synthetic-staff", createdAt: new Date("2026-10-28T20:00:00Z"), updatedAt: new Date("2026-10-28T20:00:00Z"),
    verification: {
      decision: "APPROVED_PRIVATE", confidentialityLevel: "CONFIDENTIAL", completedAt: new Date("2026-10-28T20:00:00Z"), updatedAt: new Date("2026-10-28T20:00:00Z"), reviewedBy: { name: "Synthetic reviewer" },
      needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: null, approvedPublicTarget: null,
      publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED",
    },
  });
});
const render = async () => renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));

it("announces the new tab for each private document without changing its destination", async () => {
  const html = await render();
  expect(mocks.permission).toHaveBeenCalledWith("assistance.view");
  const anchor = html.match(/<a\b[^>]*href="\/admin\/documents\/synthetic-document"[^>]*>[\s\S]*?<\/a>/)?.[0];
  expect(anchor).toContain('target="_blank"');
  expect(anchor).toContain('rel="noreferrer"');
  expect(anchor).toContain('Synthetic evidence.pdf<span class="sr-only"> (opens in a new tab)</span>');
});

afterEach(() => vi.unstubAllEnvs());


describe("admin assistance review India-local timeline", () => {
  const midnight = new Date("2026-12-31T18:30:00.000Z");
  const afterMidnight = new Date("2026-12-31T18:35:00.000Z");

  it.each([
    ["2026-12-31T18:29:59.000Z", "31 December 2026"],
    ["2026-12-31T18:30:00.000Z", "1 January 2027"],
    ["2026-12-31T18:35:00.000Z", "1 January 2027"],
  ])("renders the assistance request's received calendar day in IST for %s", async (iso, expected) => {
    vi.stubEnv("TZ", "UTC");
    const item = await mocks.request();
    mocks.request.mockResolvedValueOnce({ ...item, createdAt: new Date(iso) });

    const html = await render();

    expect(html).toContain("received " + expected);
  });

  it("displays the verification completion timestamp on the correct IST date", async () => {
    vi.stubEnv("TZ", "UTC");
    const item = await mocks.request();
    mocks.request.mockResolvedValueOnce({
      ...item,
      verification: { ...item.verification, completedAt: midnight },
    });

    const html = await render();

    expect(html).toContain("Completed 1/1/2027");
    expect(html).toContain("Synthetic reviewer");
  });

  it("displays the audit history timestamp on the correct IST date", async () => {
    vi.stubEnv("TZ", "UTC");
    mocks.history.mockResolvedValueOnce([{
      id: "synthetic-event",
      action: "synthetic_reviewed",
      createdAt: afterMidnight,
      actor: { name: "Synthetic actor" },
    }]);

    const html = await render();

    expect(html).toContain("Synthetic actor · 1/1/2027");
    expect(html).not.toContain("Synthetic actor · 31/12/2026");
  });
});
