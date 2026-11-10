import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(), user: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.cookie }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.user },
    auditEvent: { count: mocks.count, groupBy: mocks.group, findMany: mocks.find },
  },
}));

import AuditHistoryPage from "./page";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const makeUser = (permissionGroups: string[][]) => ({
  id: "synthetic-audit-reviewer",
  status: "ACTIVE",
  roles: permissionGroups.map(keys => ({
    role: { permissions: keys.map(key => ({ permission: { key } })) },
  })),
});
const page = () => AuditHistoryPage({ searchParams: Promise.resolve({}) });

function expectNoAuditReads() {
  expect(mocks.count).not.toHaveBeenCalled();
  expect(mocks.group).not.toHaveBeenCalled();
  expect(mocks.find).not.toHaveBeenCalled();
}
function expectScopedActiveSessionLookup() {
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      status: "ACTIVE",
      sessions: {
        some: { tokenHash, expiresAt: { gt: expect.any(Date) } },
      },
    },
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue(makeUser([["content.view"]]));
  for (const effect of [mocks.count, mocks.group, mocks.find]) {
    effect.mockImplementation(() => {
      throw new Error("Unexpected private audit history read");
    });
  }
});

it("blocks anonymous audit history access before any user or event query", async () => {
  mocks.cookie.mockReturnValue(undefined);
  await expect(page()).rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  expectNoAuditReads();
});

for (const value of ["forged-session", "a".repeat(42), "a".repeat(44)]) {
  it("rejects a malformed session token before querying audit events", async () => {
    mocks.cookie.mockReturnValue({ value });
    await expect(page()).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expectNoAuditReads();
  });
}

it("blocks a revoked or expired session before event counts and listings", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(page()).rejects.toThrow("Synthetic redirect: /admin/login");
  expectScopedActiveSessionLookup();
  expectNoAuditReads();
});

for (const unrelated of [
  ["content.update"], ["notification.manage"], ["appeal.view", "assistance.view"],
]) {
  it("does not grant audit history access from unrelated permissions", async () => {
    mocks.user.mockResolvedValue(makeUser([unrelated]));
    await expect(page()).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expectScopedActiveSessionLookup();
    expectNoAuditReads();
  });
}

it("allows least-privilege rbac.manage and preserves scoped audit queries", async () => {
  mocks.user.mockResolvedValue(makeUser([["content.view"], ["rbac.manage"]]));
  mocks.count.mockResolvedValue(151);
  mocks.group.mockResolvedValue([]);
  mocks.find.mockResolvedValue([]);

  const result = await AuditHistoryPage({
    searchParams: Promise.resolve({
      action: "synthetic.review", entityType: "Synthetic", page: "2",
    }),
  });

  expect(result).toBeTruthy();
  expectScopedActiveSessionLookup();
  expect(mocks.count).toHaveBeenCalledWith({
    where: { action: "synthetic.review", entityType: "Synthetic" },
  });
  expect(mocks.group).toHaveBeenCalledWith(expect.objectContaining({
    where: { action: "synthetic.review" },
  }));
  expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({
    where: { action: "synthetic.review", entityType: "Synthetic" },
    skip: 50, take: 50,
  }));
});
