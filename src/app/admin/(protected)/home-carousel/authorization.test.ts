import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  user: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.cookie }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("Synthetic redirect: " + path);
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findFirst: mocks.user } },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));

import { saveHomeCarousel } from "./actions";

const sessionToken = Buffer.alloc(32, 0xa5).toString("base64url");
const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");

function syntheticUser(permissionsByRole: string[][]) {
  return {
    id: "synthetic-carousel-editor",
    status: "ACTIVE",
    roles: permissionsByRole.map(permissions => ({
      role: {
        permissions: permissions.map(key => ({
          permission: { key },
        })),
      },
    })),
  };
}

function expectNoPrivateEffects() {
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
  expect(mocks.revalidateTag).not.toHaveBeenCalled();
}

function expectScopedSessionLookup() {
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      status: "ACTIVE",
      sessions: {
        some: {
          tokenHash: sessionTokenHash,
          expiresAt: { gt: expect.any(Date) },
        },
      },
    },
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: sessionToken });
  mocks.user.mockResolvedValue(syntheticUser([["content.view"]]));
  mocks.transaction.mockImplementation(() => {
    throw new Error("Unexpected carousel transaction");
  });
  mocks.revalidatePath.mockImplementation(() => {
    throw new Error("Unexpected cache revalidation");
  });
  mocks.revalidateTag.mockImplementation(() => {
    throw new Error("Unexpected tag revalidation");
  });
});

it("denies an anonymous carousel save before session or private reads", async () => {
  mocks.cookie.mockReturnValue(undefined);
  await expect(saveHomeCarousel(new FormData()))
    .rejects.toThrow("Synthetic redirect: /admin/login");
  expect(mocks.user).not.toHaveBeenCalled();
  expectNoPrivateEffects();
});

for (const malformed of ["forged-session", "a".repeat(42), "a".repeat(44)]) {
  it("rejects malformed admin session length before touching carousel data", async () => {
    mocks.cookie.mockReturnValue({ value: malformed });
    await expect(saveHomeCarousel(new FormData()))
      .rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expectNoPrivateEffects();
  });
}

it("denies an expired or revoked session before carousel persistence", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(saveHomeCarousel(new FormData()))
    .rejects.toThrow("Synthetic redirect: /admin/login");
  expectScopedSessionLookup();
  expectNoPrivateEffects();
});

for (const permissions of [["content.view"], ["content.approve"], ["content.view", "appeal.view"]]) {
  it("denies a non-editor even with unrelated administrative permissions", async () => {
    mocks.user.mockResolvedValue(syntheticUser([permissions]));
    await expect(saveHomeCarousel(new FormData()))
      .rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expectScopedSessionLookup();
    expectNoPrivateEffects();
  });
}

for (const permissionsByRole of [
  [["content.update"]],
  [["content.view"], ["content.update"]],
]) {
  it("allows a least-privilege editor through authentication to input validation", async () => {
    mocks.user.mockResolvedValue(syntheticUser(permissionsByRole));
    await expect(saveHomeCarousel(new FormData()))
      .rejects.toThrow(
        "Synthetic redirect: /admin/home-carousel?error=The%20submitted%20carousel%20details%20are%20invalid.",
      );
    expectScopedSessionLookup();
    expectNoPrivateEffects();
  });
}
