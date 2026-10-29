import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  user: vi.fn(),
  sideEffect: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`Synthetic redirect: ${path}`); },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.sideEffect, revalidateTag: mocks.sideEffect }));
vi.mock("@/lib/storage", () => ({
  uploadPublicMediaFile: mocks.sideEffect,
  deletePublicMediaObject: mocks.sideEffect,
  validatePublicMediaFile: mocks.sideEffect,
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.sideEffect }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.sideEffect }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  mediaAsset: {
    findUniqueOrThrow: mocks.sideEffect,
    findUnique: mocks.sideEffect,
    create: mocks.sideEffect,
    updateMany: mocks.sideEffect,
    delete: mocks.sideEffect,
  },
  auditEvent: { create: mocks.sideEffect, findFirst: mocks.sideEffect },
  homeCarousel: { findUnique: mocks.sideEffect, updateMany: mocks.sideEffect },
  $transaction: mocks.sideEffect,
} }));

import {
  createMediaAsset, deleteMediaAsset, setMediaPublication, updateMediaAsset,
} from "./media/actions";
import { saveHomeCarousel } from "./home-carousel/actions";

const sessionToken = Buffer.alloc(32, 0xa5).toString("base64url");
const sessionHash = createHash("sha256").update(sessionToken).digest("hex");

const protectedActions = [
  { name: "create media", permission: "content.update", run: () => createMediaAsset(new FormData()), invalid: /Choose a single valid content target/ },
  { name: "update media", permission: "content.update", run: () => updateMediaAsset(new FormData()), invalid: /Media record is required/ },
  { name: "publish or unpublish media", permission: "content.approve", run: () => setMediaPublication(new FormData()), invalid: /single media ID/ },
  { name: "delete media", permission: "content.approve", run: () => deleteMediaAsset(new FormData()), invalid: /single text media ID/ },
  { name: "save home carousel", permission: "content.update", run: () => saveHomeCarousel(new FormData()), invalid: /Synthetic redirect: \/admin\/home-carousel\?error=/ },
] as const;

function activeUser(permission: string) {
  return {
    id: "synthetic-editor",
    status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: permission } }] } }],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookie.mockReturnValue({ value: sessionToken });
  mocks.user.mockResolvedValue(activeUser("assistance.view"));
  mocks.sideEffect.mockImplementation(() => {
    throw new Error("Unexpected media, audit, storage or carousel side effect");
  });
});

for (const action of protectedActions) {
  describe(`${action.name} real session authorization`, () => {
    it("denies anonymous callers before any user or protected record lookup", async () => {
      mocks.cookie.mockReturnValue(undefined);

      await expect(action.run()).rejects.toThrow("Synthetic redirect: /admin/login");
      expect(mocks.user).not.toHaveBeenCalled();
      expect(mocks.sideEffect).not.toHaveBeenCalled();
    });

    it("denies malformed session tokens before any database query", async () => {
      mocks.cookie.mockReturnValue({ value: "forged-session" });

      await expect(action.run()).rejects.toThrow("Synthetic redirect: /admin/login");
      expect(mocks.user).not.toHaveBeenCalled();
      expect(mocks.sideEffect).not.toHaveBeenCalled();
    });

    it("denies a revoked, expired or inactive session before protected effects", async () => {
      mocks.user.mockResolvedValue(null);

      await expect(action.run()).rejects.toThrow("Synthetic redirect: /admin/login");
      expect(mocks.cookie).toHaveBeenCalledWith("amaana_admin_session");
      expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          status: "ACTIVE",
          sessions: { some: { tokenHash: sessionHash, expiresAt: { gt: expect.any(Date) } } },
        },
      }));
      expect(mocks.sideEffect).not.toHaveBeenCalled();
    });

    it("rejects a real session with the wrong scoped permission", async () => {
      const unrelatedPermission = action.permission === "content.approve" ? "content.update" : "content.approve";
      mocks.user.mockResolvedValue(activeUser(unrelatedPermission));

      await expect(action.run()).rejects.toThrow("Synthetic redirect: /admin/forbidden");
      expect(mocks.user).toHaveBeenCalledOnce();
      expect(mocks.sideEffect).not.toHaveBeenCalled();
    });

    it("allows the exact scoped permission to reach input validation without protected effects", async () => {
      mocks.user.mockResolvedValue(activeUser(action.permission));

      await expect(action.run()).rejects.toThrow(action.invalid);
      expect(mocks.user).toHaveBeenCalledOnce();
      expect(mocks.sideEffect).not.toHaveBeenCalled();
    });
  });
}
