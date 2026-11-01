import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  user: vi.fn(),
  document: vi.fn(),
  signedUrl: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); },
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  assistanceDocument: { findUnique: mocks.document },
  auditEvent: { create: mocks.audit },
} }));
vi.mock("@/lib/storage", () => ({ getPrivateDocumentUrl: mocks.signedUrl }));

import { GET } from "./route";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const context = { params: Promise.resolve({ id: "synthetic-document" }) };
const request = new Request("https://amaanafoundation.org/admin/documents/synthetic-document");

function invoke() {
  return GET(request, context);
}

function assertNoDocumentEffects() {
  expect(mocks.document).not.toHaveBeenCalled();
  expect(mocks.signedUrl).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue({
    id: "synthetic-editor", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "content.update" } }] } }],
  });
  for (const operation of [mocks.document, mocks.signedUrl, mocks.audit]) {
    operation.mockImplementation(() => { throw new Error("Unexpected private document operation"); });
  }
});

it("rejects an anonymous document request before any database lookup", async () => {
  mocks.cookie.mockReturnValue(undefined);
  await expect(invoke()).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  assertNoDocumentEffects();
});

it("rejects malformed session cookies before any database lookup", async () => {
  mocks.cookie.mockReturnValue({ value: "forged-session" });
  await expect(invoke()).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  assertNoDocumentEffects();
});

it("rejects an unresolvable or expired session before document access", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(invoke()).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      status: "ACTIVE",
      sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } },
    },
  }));
  assertNoDocumentEffects();
});

it("rejects a signed-in editor without assistance.view before URL signing", async () => {
  await expect(invoke()).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.user).toHaveBeenCalledOnce();
  assertNoDocumentEffects();
});

it("allows an assistance viewer through the guard but stops before document retrieval", async () => {
  mocks.user.mockResolvedValue({
    id: "synthetic-viewer", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "assistance.view" } }] } }],
  });
  await expect(invoke()).rejects.toThrow("Unexpected private document operation");
  expect(mocks.document).toHaveBeenCalledWith({
    where: { id: "synthetic-document" },
    select: { id: true, objectKey: true, assistanceRequestId: true },
  });
  expect(mocks.signedUrl).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
});
