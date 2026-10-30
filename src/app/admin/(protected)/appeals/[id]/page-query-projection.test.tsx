import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), appeal: vi.fn(), history: vi.fn(), privateRequest: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: { appeal: { findUnique: mocks.appeal }, auditEvent: { findMany: mocks.history }, assistanceRequest: { findUnique: mocks.privateRequest } } }));
vi.mock("../actions", () => ({ addAppealUpdate: vi.fn(), publishAppealUpdate: vi.fn(), transitionAppeal: vi.fn(), unpublishAppealUpdate: vi.fn(), updateAppeal: vi.fn(), updateFeaturing: vi.fn() }));
import AppealEditorPage from "./page";

const verification = {
  decision: "PENDING", completedAt: null, confidentialityLevel: "HIGHLY_SENSITIVE", publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_ALLOWED",
  medicalDetailsConsent: "NOT_ALLOWED", institutionNameConsent: "NOT_ALLOWED", archiveConsent: "NOT_ALLOWED", zakatStatus: "UNREVIEWED",
};
function record() {
  return {
    id: "synthetic-appeal", title: "Synthetic appeal", slug: "synthetic-appeal", category: "OTHER", status: "PUBLISHED", goalAmount: "100",
    summary: "Synthetic public summary", story: "Synthetic public story", updatedAt: new Date("2026-10-27T00:00:00Z"),
    updates: [{ id: "synthetic-update", title: "Synthetic update", content: "Synthetic update content", isPublic: false, author: { name: "Synthetic author" } }],
    assistanceRequest: { referenceNumber: "SYNTHETIC-REQUEST", verification },
  };
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.permission.mockResolvedValue({});
  mocks.allowed.mockImplementation((_user, permission) => permission === "assistance.view");
  mocks.appeal.mockResolvedValue(record());
  mocks.privateRequest.mockResolvedValue(record().assistanceRequest);
  mocks.history.mockResolvedValue([{ id: "synthetic-audit", action: "synthetic_reviewed", createdAt: new Date("2026-10-27T00:00:00Z"), actor: { name: "Synthetic actor" } }]);
});
const render = async () => renderToStaticMarkup(await AppealEditorPage({ params: Promise.resolve({ id: "synthetic-appeal" }) }));

it("keeps private request verification out of an appeal-only viewer's query and markup", async () => {
  mocks.allowed.mockReturnValue(false);

  const html = await render();
  expect(mocks.appeal.mock.calls[0]?.[0].include.assistanceRequest).toBeFalsy();
  expect(mocks.privateRequest).not.toHaveBeenCalled();
  expect(mocks.allowed).toHaveBeenCalledWith(expect.anything(), "assistance.view");
  expect(html).not.toContain("SYNTHETIC-REQUEST");
  expect(html).not.toContain("Verification &amp; consent boundary");
  expect(html).not.toContain("HIGHLY SENSITIVE");
  expect(html).not.toContain("NOT ALLOWED");
  expect(html).toContain("Synthetic public summary");
  expect(html).toContain("Appeal details");
  expect(html).not.toContain("Legacy standalone appeal");
});

it("reads only rendered update fields and the author's name", async () => {
  const html = await render();
  expect(mocks.appeal.mock.calls[0]?.[0].include.updates).toEqual({
    select: { id: true, title: true, content: true, isPublic: true, author: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  expect(html).toContain("Synthetic author · Internal draft");
  expect(html).toContain("Synthetic update content");
});
it("limits linked private request data to the reference and displayed verification boundary", async () => {
  const html = await render();
  expect(mocks.appeal.mock.calls[0]?.[0].include.assistanceRequest).toBeUndefined();
  expect(mocks.privateRequest.mock.calls[0]?.[0]).toEqual({ where: { appealId: "synthetic-appeal" }, select: {
    referenceNumber: true, verification: { select: Object.fromEntries(Object.keys(verification).map(key => [key, true])) },
  } });
  expect(html).toContain("Created from SYNTHETIC-REQUEST");
  for (const label of ["Decision", "Verification", "Confidentiality", "Public name", "Photo / media", "Medical details", "Institution name", "Public archive", "Zakat review"]) expect(html).toContain(`<dt>${label}</dt>`);
  expect(html).toContain("HIGHLY SENSITIVE");
  expect(html).toContain("NOT ALLOWED");
});
it("keeps only audit display fields and actor name with unchanged scope and order", async () => {
  const html = await render();
  expect(mocks.history.mock.calls[0]?.[0]).toEqual({
    where: { entityType: "Appeal", entityId: "synthetic-appeal" },
    select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  expect(html).toContain("Synthetic actor");
  expect(html).toContain("synthetic reviewed");
});
it("preserves the standalone legacy appeal state", async () => {
  mocks.privateRequest.mockResolvedValue(null);
  const html = await render();
  expect(html).toContain("Legacy standalone appeal");
  expect(html).not.toContain("Verification &amp; consent boundary");
});
it("keeps a linked reference visible when verification is absent", async () => {
  mocks.privateRequest.mockResolvedValue({ referenceNumber: "SYNTHETIC-REQUEST", verification: null });
  const html = await render();
  expect(html).toContain("Created from SYNTHETIC-REQUEST");
  expect(html).not.toContain("Verification &amp; consent boundary");
});
it("makes no database reads when page access is denied", async () => {
  mocks.permission.mockRejectedValue(new Error("denied"));
  await expect(render()).rejects.toThrow("denied");
  expect(mocks.permission).toHaveBeenCalledWith("appeal.view");
  expect(mocks.appeal).not.toHaveBeenCalled(); expect(mocks.history).not.toHaveBeenCalled();
  expect(mocks.privateRequest).not.toHaveBeenCalled();
});


it("shows the appeal audit instant in IST across midnight", async () => {
  mocks.history.mockResolvedValue([{ id: "synthetic-audit", action: "synthetic_reviewed", createdAt: new Date("2026-12-31T20:00:00.000Z"), actor: { name: "Synthetic actor" } }]);
  const html = await render();
  expect(html).toContain("Synthetic actor · 1/1/2027, 1:30:00 am");
});
it("shows the private verification completion on its IST calendar day", async () => {
  mocks.privateRequest.mockResolvedValue({ referenceNumber: "SYNTHETIC-REQUEST", verification: { ...verification, completedAt: new Date("2026-12-31T20:00:00.000Z") } });
  const html = await render();
  expect(html).toContain("Completed 1/1/2027");
});


it("announces the public preview tab without changing the appeal destination", async () => {
  const html = await render();
  const anchor = html.match(/<a\b[^>]*href="\/appeals\/synthetic-appeal"[^>]*>[\s\S]*?<\/a>/)?.[0];
  expect(anchor).toContain('target="_blank"');
  expect(anchor).toContain('rel="noreferrer"');
  expect(anchor).toContain('View public page<span class="sr-only"> (opens in a new tab)</span>');
});
