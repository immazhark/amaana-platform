import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  user: vi.fn(),
  reconcile: vi.fn(),
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
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { reconcileDonationAction } from "./actions";

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
