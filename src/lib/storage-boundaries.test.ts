import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deletePublicMediaObject,
  getPrivateDocumentUrl,
  getPublicMediaObject,
  getPublicMediaStorageReadiness,
  uploadCuratedPublicMediaFile,
  uploadPrivateDocument,
  uploadPublicMediaFile,
} from "./storage";

const sdk = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn(), sign: vi.fn() }));

vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    input: unknown;
    constructor(input: unknown) { this.input = input; }
  }
  return {
    S3Client: class {
      constructor(config: unknown) { sdk.create(config); }
      send = sdk.send;
    },
    PutObjectCommand: Command,
    GetObjectCommand: Command,
    DeleteObjectCommand: Command,
    HeadObjectCommand: Command,
  };
});
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: sdk.sign }));

const key = "2026/123e4567-e89b-12d3-a456-426614174000.pdf";
const bytes = "%PDF-1.7\n";
const hash = createHash("sha256").update(bytes).digest("hex");
const file = () => new File([bytes], "synthetic.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.clearAllMocks();
  sdk.send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) } });
  sdk.sign.mockResolvedValue("https://storage.example.org/synthetic-signed-url");
  vi.stubEnv("S3_REGION", "ap-south-1");
  vi.stubEnv("S3_BUCKET", "private-evidence");
  vi.stubEnv("S3_ACCESS_KEY_ID", "synthetic-key");
  vi.stubEnv("S3_SECRET_ACCESS_KEY", "synthetic-secret");
  vi.stubEnv("PUBLIC_MEDIA_S3_BUCKET", "public-gallery");
  vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.example.org/prefix");
  vi.stubEnv("MEDIA_S3_ACCESS_KEY_ID", "");
  vi.stubEnv("MEDIA_S3_SECRET_ACCESS_KEY", "");
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("public/private storage configuration boundary", () => {
  const operations = [
    ["upload", () => uploadPublicMediaFile(file())],
    ["curated upload", () => uploadCuratedPublicMediaFile(file(), key, hash)],
    ["read", () => getPublicMediaObject(key)],
    ["delete", () => deletePublicMediaObject(key)],
  ] as const;
  for (const [name, operation] of operations) {
    it("rejects shared-bucket " + name + " before creating an S3 client", async () => {
      vi.stubEnv("PUBLIC_MEDIA_S3_BUCKET", "private-evidence");
      await expect(operation()).rejects.toThrow(/separate bucket/);
      expect(sdk.create).not.toHaveBeenCalled();
      expect(sdk.send).not.toHaveBeenCalled();
      expect(sdk.sign).not.toHaveBeenCalled();
    });
  }

  it("normalizes bucket names before enforcing separation", async () => {
    vi.stubEnv("PUBLIC_MEDIA_S3_BUCKET", " private-evidence ");
    await expect(deletePublicMediaObject(key)).rejects.toThrow(/separate bucket/);
    expect(sdk.create).not.toHaveBeenCalled();
    expect(sdk.send).not.toHaveBeenCalled();
  });

  it("retains private-evidence upload and signing independently of public misconfiguration", async () => {
    vi.stubEnv("PUBLIC_MEDIA_S3_BUCKET", "private-evidence");
    const uploaded = await uploadPrivateDocument(file(), "request-123");
    expect(sdk.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({ Bucket: "private-evidence", CacheControl: "private, no-store, max-age=0" }),
    }));
    await expect(getPrivateDocumentUrl(uploaded.objectKey, "request-123"))
      .resolves.toBe("https://storage.example.org/synthetic-signed-url");
    expect(sdk.sign).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ input: expect.objectContaining({ Bucket: "private-evidence", Key: uploaded.objectKey }) }),
      { expiresIn: 60 },
    );
  });
});

describe("delivery configuration is validated before public persistence", () => {
  it.each([
    "https://user:secret@media.example.org",
    "https://media.example.org?token=synthetic",
    "https://media.example.org#fragment",
    "http://media.example.org",
    "not-a-url",
  ])("rejects unsafe configured base %s without writing an orphan", async base => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", base);
    await expect(uploadPublicMediaFile(file())).rejects.toThrow();
    expect(sdk.create).not.toHaveBeenCalled();
    expect(sdk.send).not.toHaveBeenCalled();
    expect(getPublicMediaStorageReadiness().deliveryReady).toBe(false);
  });

  it("returns the consent-gated local route and avoids immutable storage caching", async () => {
    const uploaded = await uploadPublicMediaFile(file());
    expect(uploaded.publicUrl).toMatch(
      new RegExp("^/media/" + new Date().getUTCFullYear() + "/[a-f0-9-]+\\.pdf$"),
    );
    expect(sdk.send).toHaveBeenCalledTimes(1);
    expect(sdk.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({ Bucket: "public-gallery", CacheControl: "private, no-store, max-age=0" }),
    }));
  });

  it("still returns the protected local route when no external delivery base is configured", async () => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "");
    await expect(uploadPublicMediaFile(file())).resolves.toMatchObject({ publicUrl: expect.stringMatching(/^\/media\/\d{4}\//) });
    expect(sdk.send).toHaveBeenCalledTimes(1);
  });
});

describe("public object reads enforce upload-size and completeness boundaries", () => {
  it("closes an oversized object before reading its body", async () => {
    const consumed = vi.fn();
    const closed = vi.fn();
    const body = {
      destroy: closed,
      async *[Symbol.asyncIterator]() { consumed(); yield new Uint8Array([1]); },
    };
    sdk.send.mockResolvedValue({ Body: body, ContentLength: 5 * 1024 * 1024 + 1 });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/size boundary/);
    expect(consumed).not.toHaveBeenCalled();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it("rejects a declared oversized object even if cancellation never settles", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const consumed = vi.fn();
    sdk.send.mockResolvedValue({
      ContentLength: 5 * 1024 * 1024 + 1,
      Body: { cancel, async *[Symbol.asyncIterator]() { consumed(); yield new Uint8Array([1]); } },
    });

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await expect(Promise.race([
        getPublicMediaObject(key),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error("S3 cleanup stalled media response")), 150);
        }),
      ])).rejects.toThrow(/size boundary/);
      expect(cancel).toHaveBeenCalledOnce();
      expect(consumed).not.toHaveBeenCalled();
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  });

  it("preserves the size error when cleanup rejects asynchronously", async () => {
    const cancel = vi.fn(async () => { throw new Error("synthetic private cleanup error"); });
    sdk.send.mockResolvedValue({
      ContentLength: 5 * 1024 * 1024 + 1,
      Body: { cancel, async *[Symbol.asyncIterator]() { yield new Uint8Array([1]); } },
    });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/size boundary/);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("preserves the size error when cleanup throws synchronously", async () => {
    const cancel = vi.fn(() => { throw new Error("synthetic synchronous cleanup error"); });
    sdk.send.mockResolvedValue({
      ContentLength: 5 * 1024 * 1024 + 1,
      Body: { cancel, async *[Symbol.asyncIterator]() { yield new Uint8Array([1]); } },
    });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/size boundary/);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("bounds unknown-length bodies and closes the iterator on overflow", async () => {
    const consumed = vi.fn();
    const closed = vi.fn();
    const body = {
      async *[Symbol.asyncIterator]() {
        try {
          for (let index = 0; index < 10; index++) {
            consumed();
            yield new Uint8Array(1024 * 1024);
          }
        } finally { closed(); }
      },
    };
    sdk.send.mockResolvedValue({ Body: body });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/size boundary/);
    expect(consumed).toHaveBeenCalledTimes(6);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown-length overflow without awaiting an iterator that refuses to close", async () => {
    const iterator = {
      next: vi.fn(async () => ({ done: false as const, value: new Uint8Array(1024 * 1024) })),
      return: vi.fn(() => new Promise<IteratorResult<Uint8Array>>(() => {})),
    };
    sdk.send.mockResolvedValue({
      Body: { [Symbol.asyncIterator]: () => iterator },
    });

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await expect(Promise.race([
        getPublicMediaObject(key),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error("iterator cleanup stalled the response")), 200);
        }),
      ])).rejects.toThrow(/size boundary/);
      expect(iterator.next).toHaveBeenCalledTimes(6);
      expect(iterator.return).toHaveBeenCalledOnce();
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  });

  it("preserves invalid stream data errors when iterator cleanup throws", async () => {
    const iterator = {
      next: vi.fn(async () => ({ done: false as const, value: "synthetic bad bytes" })),
      return: vi.fn(() => { throw new Error("synthetic iterator cleanup failure"); }),
    };
    sdk.send.mockResolvedValue({ Body: { [Symbol.asyncIterator]: () => iterator } });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/invalid byte data/);
    expect(iterator.return).toHaveBeenCalledOnce();
  });

  it("rejects truncated bodies instead of caching incomplete media", async () => {
    sdk.send.mockResolvedValue({
      ContentLength: 3,
      Body: { async *[Symbol.asyncIterator]() { yield new Uint8Array([1, 2]); } },
    });
    await expect(getPublicMediaObject(key)).rejects.toThrow(/incomplete/);
  });

  it("bounds a stalled S3 iterator and aborts its underlying body", async () => {
    const destroy = vi.fn();
    const next = vi.fn(() => new Promise<IteratorResult<Uint8Array>>(() => {}));
    const body = {
      destroy,
      [Symbol.asyncIterator]: () => ({ next }),
    };
    sdk.send.mockResolvedValue({ Body: body });

    vi.useFakeTimers();
    try {
      let outcome: string | null = null;
      void getPublicMediaObject(key).then(
        () => { outcome = "unexpected-success"; },
        (error: unknown) => { outcome = error instanceof Error ? error.message : "invalid-error"; },
      );

      await vi.advanceTimersByTimeAsync(15_001);
      expect(outcome).toMatch(/Public media object read timed out/);
      expect(next).toHaveBeenCalledOnce();
      expect(destroy).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("copies S3 stream chunks before a producer reuses the backing buffer", async () => {
    // Some async iterators reuse a staging buffer between pulls. Holding a
    // zero-copy Buffer view can corrupt already-accepted image/document bytes.
    const shared = new Uint8Array([1, 2, 3]);
    const body = {
      async *[Symbol.asyncIterator]() {
        yield shared;
        shared.set([4, 5, 6]);
        yield shared;
      },
    };
    sdk.send.mockResolvedValue({
      ContentLength: 6,
      ContentType: "application/pdf",
      Body: body,
    });

    const result = await getPublicMediaObject(key);
    expect([...result.bytes]).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.bytes.byteLength).toBe(6);
  });

  it("preserves valid streamed bytes and delivery metadata", async () => {
    const lastModified = new Date("2026-10-12T00:00:00Z");
    sdk.send.mockResolvedValue({
      ContentLength: 3,
      ContentType: "application/pdf",
      ETag: "synthetic-etag",
      LastModified: lastModified,
      Body: { async *[Symbol.asyncIterator]() { yield new Uint8Array([1, 2]); yield new Uint8Array([3]); } },
    });
    const object = await getPublicMediaObject(key);
    expect([...object.bytes]).toEqual([1, 2, 3]);
    expect(object).toMatchObject({ contentType: "application/pdf", etag: "synthetic-etag", lastModified });
  });
});
