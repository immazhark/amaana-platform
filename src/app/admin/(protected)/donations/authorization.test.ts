import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  user: vi.fn(),
  reconcile: vi.fn(),
  reissue: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); },
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
vi.mock("@/lib/direct-donation-reconciliation", () => ({
  reconcileDirectDonation: mocks.reconcile,
}));
vi.mock("@/lib/receipt-link-reissue", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/receipt-link-reissue")>()),
  reissueReceiptLink: mocks.reissue,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { reconcileDonationAction, reissueReceiptLinkAction } from "./actions";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");

function validForm() {
  const form = new FormData();
  form.set("donationId", "synthetic-donation");
  form.set("decision", "VERIFY");
  form.set("notes", "Synthetic bank-reference review");
  return form;
}

function assertNoFinanceEffects() {
  expect(mocks.reconcile).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue({
    id: "synthetic-editor", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "content.update" } }] } }],
  });
  mocks.reconcile.mockImplementation(() => { throw new Error("Synthetic financial checkpoint"); });
  mocks.reissue.mockResolvedValue({ referenceNumber: "AFD-SYNTHETIC-0001", path: "/donations/AFD-SYNTHETIC-0001/acknowledgement#token=synthetic" });
  mocks.revalidate.mockImplementation(() => { throw new Error("Unexpected cache mutation"); });
});

it("rejects anonymous reconciliation before session lookup or financial effects", async () => {
  mocks.cookie.mockReturnValue(undefined);
  await expect(reconcileDonationAction(validForm())).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  assertNoFinanceEffects();
});

it("rejects malformed session tokens before session lookup", async () => {
  mocks.cookie.mockReturnValue({ value: "forged-session" });
  await expect(reconcileDonationAction(validForm())).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  assertNoFinanceEffects();
});

it("rejects a session without an active unexpired user before reconciliation", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(reconcileDonationAction(validForm())).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
    where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } },
  }));
  assertNoFinanceEffects();
});

it("denies an active editor lacking donation.reconcile before financial effects", async () => {
  await expect(reconcileDonationAction(validForm())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.user).toHaveBeenCalledOnce();
  assertNoFinanceEffects();
});

it("lets a scoped reconciler reach only the synthetic reconciliation checkpoint", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-reconciler", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "donation.reconcile" } }] } }],
  });
  await expect(reconcileDonationAction(validForm())).rejects.toThrow("Synthetic financial checkpoint");
  expect(mocks.reconcile).toHaveBeenCalledWith({
    donationId: "synthetic-donation", actorId: "synthetic-reconciler",
    decision: "VERIFY", notes: "Synthetic bank-reference review",
  });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});

const idle = { kind: "idle" as const, message: "" };

function reissueForm() {
  const form = new FormData();
  form.set("donationId", "synthetic-donation");
  form.set("reason", "Donor lost the link and confirmed by phone");
  return form;
}

it("rejects anonymous link reissue before any lookup or change", async () => {
  mocks.cookie.mockReturnValue(undefined);
  await expect(reissueReceiptLinkAction(idle, reissueForm())).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.reissue).not.toHaveBeenCalled();
});

it("denies an active editor lacking donation.reconcile before the link is touched", async () => {
  await expect(reissueReceiptLinkAction(idle, reissueForm())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.reissue).not.toHaveBeenCalled();
});

it("lets a scoped reconciler reissue a link and returns it once", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-reconciler", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "donation.reconcile" } }] } }],
  });
  mocks.revalidate.mockImplementation(() => undefined);
  const result = await reissueReceiptLinkAction(idle, reissueForm());
  expect(mocks.reissue).toHaveBeenCalledWith({ donationId: "synthetic-donation", actorId: "synthetic-reconciler", reason: "Donor lost the link and confirmed by phone" });
  expect(result).toMatchObject({ kind: "success" });
  expect(result.message).toContain("AFD-SYNTHETIC-0001");
  expect(result.message).toContain("/donations/AFD-SYNTHETIC-0001/acknowledgement#token=");
});

it("reports an unexpected failure generically, without the cause", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-reconciler", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "donation.reconcile" } }] } }],
  });
  mocks.reissue.mockRejectedValue(new Error("connection string postgres://secret@host/db"));
  const result = await reissueReceiptLinkAction(idle, reissueForm());
  expect(result).toEqual({ kind: "error", message: "The link could not be reissued. Nothing was changed; try again." });
});

it("refuses a repeated donationId field instead of trusting the first", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-reconciler", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "donation.reconcile" } }] } }],
  });
  const form = reissueForm();
  form.append("donationId", "other-donation");
  const result = await reissueReceiptLinkAction(idle, form);
  expect(result).toEqual({ kind: "error", message: "The link could not be reissued. Nothing was changed; try again." });
  expect(mocks.reissue).not.toHaveBeenCalled();
});
