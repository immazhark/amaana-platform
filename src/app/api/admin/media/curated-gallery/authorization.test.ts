import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(), userFindFirst: vi.fn(), privileged: vi.fn(),
  runtime: vi.fn(), log: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookieGet }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.userFindFirst },
  auditEvent: { findFirst: mocks.privileged, create: mocks.privileged },
  initiative: { findMany: mocks.privileged },
  mediaAsset: { findMany: mocks.privileged },
} }));
vi.mock("@/lib/curated-gallery-server", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/curated-gallery-server")>();
  return { ...actual, assertCuratedGalleryRuntime: mocks.runtime };
});
vi.mock("@/lib/storage", () => ({
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  getPublicMediaStorageReadiness: mocks.privileged,
  uploadCuratedPublicMediaFile: mocks.privileged,
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));

// Auth/session resolution, permission checks and origin validation remain real.
import { POST as start } from "./start/route";
import { POST as upload } from "./upload/route";
import { POST as publish } from "./publish/route";
import { GET as status } from "./status/route";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
// Production sessions are 32 random bytes encoded without base64 padding.
const tokenHash = createHash("sha256").update(token).digest("hex");
type AuthorizedRoute = {
  name: string;
  run: (request: Request) => Promise<Response>;
  method: "POST" | "GET";
};
const routes: readonly AuthorizedRoute[] = [
  { name: "start", run: start, method: "POST" },
  { name: "upload", run: upload, method: "POST" },
  { name: "publish", run: publish, method: "POST" },
  { name: "status", run: status, method: "GET" },
];

function user(roles: readonly (readonly string[])[]) {
  return { id: "synthetic-user", status: "ACTIVE", roles: roles.map(keys => ({
    role: { permissions: keys.map(key => ({ permission: { key } })) },
  })) };
}
function request(method: string, origin: string | null = "https://amaanafoundation.org") {
  const headers = new Headers();
  if (origin !== null) headers.set("origin", origin);
  return new Request("https://amaanafoundation.org/api/synthetic", { method, headers });
}
function assertPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store, private");
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
}
function assertStopped() {
  expect(mocks.runtime).not.toHaveBeenCalled();
  expect(mocks.privileged).not.toHaveBeenCalled();
}
function assertSessionQuery() {
  expect(mocks.userFindFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      status: "ACTIVE",
      sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } },
    },
  }));
  expect(JSON.stringify(mocks.userFindFirst.mock.calls)).not.toContain(token);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
  mocks.cookieGet.mockReturnValue({ value: token });
  mocks.userFindFirst.mockResolvedValue(user([["content.update", "content.approve"]]));
  mocks.runtime.mockImplementation(() => { throw new Error("Synthetic authorized checkpoint"); });
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected privileged operation"); });
});
afterEach(() => { vi.unstubAllEnvs(); });

for (const route of routes) {
  describe(route.name + " actual-helper authorization boundaries", () => {
    it("rejects an absent session before lookup or privileged work", async () => {
      mocks.cookieGet.mockReturnValue(undefined);
      const response = await route.run(request(route.method));
      expect(response.status).toBe(401);
      assertPrivate(response);
      expect(mocks.userFindFirst).not.toHaveBeenCalled();
      assertStopped();
    });

    it("rejects malformed cookie input before session lookup or privileged work", async () => {
      mocks.cookieGet.mockReturnValue({ value: "forged-session" });
      const response = await route.run(request(route.method));
      expect(response.status).toBe(401);
      assertPrivate(response);
      expect(mocks.userFindFirst).not.toHaveBeenCalled();
      assertStopped();
    });

    it("rejects a session that resolves no active unexpired user", async () => {
      mocks.userFindFirst.mockResolvedValue(null);
      const response = await route.run(request(route.method));
      expect(response.status).toBe(401);
      assertPrivate(response);
      assertSessionQuery();
      assertStopped();
    });

    for (const permissions of [[], ["content.update"], ["content.approve"]]) {
      it("rejects incomplete permissions " + JSON.stringify(permissions), async () => {
        mocks.userFindFirst.mockResolvedValue(user([permissions]));
        const response = await route.run(request(route.method));
        expect(response.status).toBe(403);
        assertPrivate(response);
        assertSessionQuery();
        assertStopped();
      });
    }

    for (const roles of [
      [["content.update", "content.approve"]],
      [["content.update"], ["content.approve"]],
    ]) {
      it("passes the guard with both scoped permissions " + JSON.stringify(roles), async () => {
        mocks.userFindFirst.mockResolvedValue(user(roles));
        const response = await route.run(request(route.method));
        // Stop at the first authorized runtime operation; do not publish/upload.
        expect(mocks.runtime).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(500);
        assertPrivate(response);
        assertSessionQuery();
        expect(mocks.privileged).not.toHaveBeenCalled();
        expect(await response.text()).not.toContain("Synthetic authorized checkpoint");
      });
    }

    if (route.method === "POST") {
      for (const origin of ["https://untrusted.example", "null", null]) {
        it("rejects mutation origin " + String(origin) + " before session lookup", async () => {
          const response = await route.run(request(route.method, origin));
          expect(response.status).toBe(403);
          assertPrivate(response);
          expect(mocks.cookieGet).not.toHaveBeenCalled();
          expect(mocks.userFindFirst).not.toHaveBeenCalled();
          assertStopped();
        });
      }
    }
  });
}
