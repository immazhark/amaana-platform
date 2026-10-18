import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
  cookieDelete: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => mocks.cookieValue === undefined ? undefined : { value: mocks.cookieValue },
    delete: mocks.cookieDelete,
  }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.findFirst },
    session: { deleteMany: mocks.deleteMany },
  },
}));

import { destroySession, getCurrentUser } from "./auth";

const validToken = Buffer.alloc(32, 0xa5).toString("base64url");

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookieValue = undefined;
});

describe("admin session cookie validation before database lookup", () => {
  it("accepts the same 32-byte base64url token format used at login", async () => {
    expect(validToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    mocks.cookieValue = validToken;
    mocks.findFirst.mockResolvedValueOnce({ id: "synthetic-admin", roles: [] });

    await expect(getCurrentUser()).resolves.toEqual({ id: "synthetic-admin", roles: [] });
    expect(mocks.findFirst).toHaveBeenCalledOnce();
    const where = mocks.findFirst.mock.calls[0]?.[0]?.where;
    expect(where.sessions.some.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    "",
    "a",
    "a".repeat(42),
    "a".repeat(44),
    "a".repeat(10_000),
    "a".repeat(20) + "+" + "b".repeat(22),
    "a".repeat(20) + "=" + "b".repeat(22),
    "a".repeat(20) + "." + "b".repeat(22),
    "a".repeat(20) + "\n" + "b".repeat(22),
  ])("rejects a malformed or oversized cookie before a session query", async malformed => {
    mocks.cookieValue = malformed;
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("ignores an absent cookie without querying the database", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("expires a structurally valid but unknown token through the normal database lookup", async () => {
    mocks.cookieValue = validToken;
    mocks.findFirst.mockResolvedValueOnce(null);
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledOnce();
  });

  it("clears malformed logout cookies without trying to delete a database session", async () => {
    mocks.cookieValue = "spoofed-cookie";
    await destroySession();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    expect(mocks.cookieDelete).toHaveBeenCalledWith("amaana_admin_session");
  });

  it("continues to revoke a valid logout token and delete the cookie", async () => {
    mocks.cookieValue = validToken;
    mocks.deleteMany.mockResolvedValueOnce({ count: 1 });
    await destroySession();
    expect(mocks.deleteMany).toHaveBeenCalledOnce();
    expect(mocks.cookieDelete).toHaveBeenCalledWith("amaana_admin_session");
  });
});
