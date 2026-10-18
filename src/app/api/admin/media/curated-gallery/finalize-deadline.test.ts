import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), permission: vi.fn(), runtime: vi.fn(), storage: vi.fn(),
  session: vi.fn(), createSession: vi.fn(), transaction: vi.fn(), log: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user, hasPermission: mocks.permission }));
vi.mock("@/lib/storage", () => ({ getPublicMediaStorageReadiness: mocks.storage }));
vi.mock("@/lib/prisma", () => ({
  prisma: { auditEvent: { findFirst: mocks.session, create: mocks.createSession } },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("@/lib/curated-gallery-server", () => ({
  CURATED_GALLERY_ENTITY_TYPE: "synthetic-curated",
  CURATED_GALLERY_START_ACTION: "synthetic-start",
  assertCuratedGalleryRuntime: mocks.runtime,
  buildCuratedGallerySessionMetadata: vi.fn(),
  deriveCuratedGalleryStorage: vi.fn(),
  parseCuratedGalleryManifestText: vi.fn(),
  parseCuratedGallerySessionMetadata: vi.fn(),
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));

import { POST as start } from "./start/route";
import { POST as publish } from "./publish/route";

const origin = "https://amaanafoundation.org";
const headers = { Origin: origin, "Content-Type": "application/json" };
function request(path: "start" | "publish", body: ReadableStream<Uint8Array> | string) {
  return new Request(`${origin}/api/admin/media/curated-gallery/${path}`, {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}
function neverEnding(cancel: ReturnType<typeof vi.fn>) {
  return new ReadableStream<Uint8Array>({ cancel });
}
function privateRetry(response: Response) {
  expect(response.status).toBe(503);
  expect(response.headers.get("retry-after")).toBe("60");
  expect(response.headers.get("cache-control")).toMatch(/no-store/i);
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-robots-tag")).toMatch(/noindex/);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
  mocks.user.mockResolvedValue({ id: "synthetic-admin" });
  mocks.permission.mockReturnValue(true);
  mocks.storage.mockReturnValue({ uploadReady: true, separateBucketConfigured: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("authenticated curated gallery completion ingress", () => {
  it("bounds the 256 KiB start manifest read by one absolute 15-second deadline", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    let result: Response | undefined;
    void start(request("start", neverEnding(cancel))).then(response => { result = response; });
    await vi.advanceTimersByTimeAsync(14_999);
    expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(result).toBeDefined();
    privateRetry(result!);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("bounds exact publication confirmation by one absolute five-second deadline", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    let result: Response | undefined;
    void publish(request("publish", neverEnding(cancel))).then(response => { result = response; });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(result).toBeDefined();
    privateRetry(result!);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each(["start", "publish"] as const)(
    "classifies a broken %s transport as retryable without reading or storing a manifest",
    async path => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) { controller.error(new Error("PRIVATE_STREAM_DIAGNOSTIC")); },
      });
      const response = await (path === "start" ? start : publish)(request(path, stream));
      privateRetry(response);
      expect(JSON.stringify(await response.json())).not.toContain("PRIVATE_STREAM_DIAGNOSTIC");
      expect(mocks.session).not.toHaveBeenCalled();
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );

  it.each(["start", "publish"] as const)(
    "keeps a completely read but malformed %s JSON request at HTTP 400",
    async path => {
      const response = await (path === "start" ? start : publish)(request(path, "{invalid-json"));
      expect(response.status).toBe(400);
      expect(response.headers.get("retry-after")).toBeNull();
      expect(mocks.session).not.toHaveBeenCalled();
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );

  it.each(["start", "publish"] as const)(
    "preserves an oversized %s request's 413 without touching the database",
    async path => {
      const response = await (path === "start" ? start : publish)(new Request(
        `${origin}/api/admin/media/curated-gallery/${path}`,
        { method: "POST", headers: { ...headers, "Content-Length": String(300 * 1024) }, body: "{}" },
      ));
      expect(response.status).toBe(413);
      expect(mocks.session).not.toHaveBeenCalled();
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );
});
