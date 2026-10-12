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

  it("preserves HTTPS delivery prefixes and immutable cache policy", async () => {
    const uploaded = await uploadPublicMediaFile(file());
    expect(uploaded.publicUrl).toMatch(
      new RegExp("^https://media\\.example\\.org/prefix/" + new Date().getUTCFullYear() + "/[a-f0-9-]+\\.pdf$"),
    );
    expect(sdk.send).toHaveBeenCalledTimes(1);
    expect(sdk.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({ Bucket: "public-gallery", CacheControl: "public, max-age=31536000, immutable" }),
    }));
  });

  it("allows an unpublished upload without a configured delivery base", async () => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "");
    await expect(uploadPublicMediaFile(file())).resolves.toMatchObject({ publicUrl: null });
    expect(sdk.send).toHaveBeenCalledTimes(1);
  });
});
