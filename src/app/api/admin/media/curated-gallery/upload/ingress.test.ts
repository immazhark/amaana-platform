import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  readiness: vi.fn(),
  readBody: vi.fn(),
  runtime: vi.fn(),
  session: vi.fn(),
  storageUpload: vi.fn(),
  transaction: vi.fn(),
  log: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.user,
  hasPermission: () => true,
}));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true }));
vi.mock("@/lib/storage", () => ({
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  getPublicMediaStorageReadiness: mocks.readiness,
  uploadCuratedPublicMediaFile: mocks.storageUpload,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { auditEvent: { findFirst: mocks.session } },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("@/lib/curated-gallery-contract", () => ({
  CURATED_GALLERY_BATCH: "synthetic-reviewed-batch",
}));
vi.mock("@/lib/curated-gallery-server", () => ({
  CURATED_GALLERY_ENTITY_TYPE: "CuratedGallery",
  CURATED_GALLERY_START_ACTION: "curated-gallery.start",
  assertCuratedGalleryRuntime: mocks.runtime,
  curatedGalleryRecordById: vi.fn(),
  deriveCuratedGalleryStorage: vi.fn(),
  parseCuratedGallerySessionMetadata: vi.fn(),
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));
vi.mock("@/lib/bounded-request-body", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/bounded-request-body")>();
  return {
    ...actual,
    readBodyBytesWithLimit: (...args: Parameters<typeof actual.readBodyBytesWithLimit>) => mocks.readBody(...args),
  };
});

import { POST } from "./route";

function uploadForm() {
  const form = new FormData();
  form.set("batch", "synthetic-reviewed-batch");
  form.set("recordId", "synthetic-photo-1");
  form.set("file", new File(["synthetic bytes only"], "synthetic-photo.jpg", { type: "image/jpeg" }));
  return form;
}

function request(body: BodyInit, headers?: HeadersInit) {
  return new Request("https://amaana.example/api/admin/media/curated-gallery/upload", {
    method: "POST", headers, body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function assertNoMediaWrites() {
  expect(mocks.session).not.toHaveBeenCalled();
  expect(mocks.storageUpload).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "synthetic-admin" });
  mocks.readiness.mockReturnValue({ uploadReady: true, separateBucketConfigured: true });
  mocks.session.mockResolvedValue(null);
  const actual = await vi.importActual<typeof import("@/lib/bounded-request-body")>("@/lib/bounded-request-body");
  mocks.readBody.mockImplementation(actual.readBodyBytesWithLimit);
});

describe("authorized curated gallery multipart ingress", () => {
  it("returns a private retryable 503 for a timed-out upload, without storing evidence", async () => {
    const { RequestBodyReadTimeoutError } = await import("@/lib/bounded-request-body");
    mocks.readBody.mockRejectedValueOnce(new RequestBodyReadTimeoutError());
    const response = await POST(request(uploadForm()));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    assertNoMediaWrites();
  });

  it("does not mislabel an interrupted upload stream as an invalid curated image", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new Error("synthetic interrupted connection")); },
    });
    const response = await POST(request(stream, { "Content-Type": "multipart/form-data; boundary=test" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    assertNoMediaWrites();
  });

  it("expires one absolute deadline for a trickling upload with an unresolved cancellation", async () => {
    vi.useFakeTimers();
    try {
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream<Uint8Array>({
        start(c) { controller = c; },
        cancel() { return new Promise<void>(() => {}); },
      });
      const result = Promise.race([
        POST(request(stream, { "Content-Type": "multipart/form-data; boundary=test" })),
        new Promise<"stalled">(resolve => setTimeout(() => resolve("stalled"), 120_001)),
      ]);
      await vi.advanceTimersByTimeAsync(0);
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(30_000);
        controller.enqueue(new Uint8Array([65]));
      }
      await vi.advanceTimersByTimeAsync(30_001);
      const response = await result;
      if (response === "stalled") throw new Error("Upload has no absolute deadline");
      expect(response.status).toBe(503);
      assertNoMediaWrites();
    } finally { vi.useRealTimers(); }
  });

  it("keeps complete malformed multipart input at private HTTP 400", async () => {
    const response = await POST(request("not a multipart body", { "Content-Type": "multipart/form-data; boundary=test" }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    assertNoMediaWrites();
  });

  it("rejects oversized uploads before session or storage work", async () => {
    const response = await POST(request("short", {
      "Content-Type": "multipart/form-data; boundary=test",
      "Content-Length": String(6 * 1024 * 1024),
    }));
    expect(response.status).toBe(413);
    assertNoMediaWrites();
  });

  it.each(["batch", "recordId", "file"] as const)("rejects duplicate %s fields before session lookup", async field => {
    const form = uploadForm();
    if (field === "file") {
      form.append(field, new File(["different synthetic bytes"], "second.jpg", { type: "image/jpeg" }));
    } else {
      form.append(field, "another value");
    }
    const response = await POST(request(form));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/ambiguous/i);
    assertNoMediaWrites();
  });

  it.each(["batch", "recordId"] as const)("rejects binary-valued %s metadata", async field => {
    const form = uploadForm();
    form.set(field, new File(["binary metadata"], "field.txt", { type: "text/plain" }));
    const response = await POST(request(form));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/ambiguous/i);
    assertNoMediaWrites();
  });

  it("still accepts one valid metadata set and file up to the existing manifest-session checkpoint", async () => {
    const response = await POST(request(uploadForm()));
    expect(response.status).toBe(409);
    expect(mocks.readBody).toHaveBeenCalledWith(expect.any(Request), 5 * 1024 * 1024 + 512 * 1024, { timeoutMs: 120_000 });
    expect(mocks.session).toHaveBeenCalledOnce();
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });
});
