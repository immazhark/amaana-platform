import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged }));
vi.mock("@/lib/storage", () => ({ deletePrivateDocumentObject: mocks.privileged }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  assistanceDocument: { findUniqueOrThrow: mocks.privileged, updateMany: mocks.privileged, delete: mocks.privileged },
  auditEvent: { findFirst: mocks.privileged, create: mocks.privileged },
  $transaction: mocks.privileged,
} }));

import { reviewDocumentRetention } from "./actions";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");

function form(decision: "DELETE" | "PLACE_HOLD") {
  const data = new FormData();
  data.set("documentId", "synthetic-document");
  data.set("decision", decision);
  data.set("reason", "Synthetic retention review only");
  if (decision === "DELETE") data.set("deleteConfirmation", "DELETE");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue({
    id: "synthetic-editor", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "content.update" } }] } }],
  });
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected private evidence operation"); });
});

for (const decision of ["DELETE", "PLACE_HOLD"] as const) {
  it(decision + " denies anonymous access before session or private effects", async () => {
    mocks.cookie.mockReturnValue(undefined);
    await expect(reviewDocumentRetention(form(decision))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(decision + " denies malformed cookies before any user lookup", async () => {
    mocks.cookie.mockReturnValue({ value: "forged-session" });
    await expect(reviewDocumentRetention(form(decision))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(decision + " denies an unresolvable or expired session", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(reviewDocumentRetention(form(decision))).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } },
    }));
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(decision + " denies a signed-in editor without assistance.approve", async () => {
    await expect(reviewDocumentRetention(form(decision))).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}

it("permits a scoped retention reviewer only until the fail-closed private document lookup", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-reviewer", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "assistance.approve" } }] } }],
  });
  await expect(reviewDocumentRetention(form("DELETE"))).rejects.toThrow("Unexpected private evidence operation");
  expect(mocks.privileged).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "synthetic-document" },
  }));
  expect(mocks.privileged).toHaveBeenCalledOnce();
});
