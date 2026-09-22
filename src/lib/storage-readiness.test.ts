import { afterEach, describe, expect, it } from "vitest";
import {
  getPublicMediaStorageReadiness,
  isManagedPrivateDocumentKey,
  PRIVATE_OBJECT_CACHE_CONTROL,
  PUBLIC_MEDIA_CACHE_CONTROL,
  readImageDimensions,
} from "./storage";

const keys = [
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "PUBLIC_MEDIA_S3_REGION",
  "PUBLIC_MEDIA_S3_BUCKET",
  "PUBLIC_MEDIA_S3_ACCESS_KEY_ID",
  "PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY",
  "PUBLIC_MEDIA_BASE_URL",
] as const;

const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getPublicMediaStorageReadiness", () => {
  it("is ready when a separate bucket and HTTPS delivery origin are configured", () => {
    process.env.S3_REGION = "ap-south-1";
    process.env.S3_BUCKET = "private-assistance";
    process.env.S3_ACCESS_KEY_ID = "key";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    process.env.PUBLIC_MEDIA_S3_BUCKET = "public-media";
    process.env.PUBLIC_MEDIA_BASE_URL = "https://media.example.org";

    expect(getPublicMediaStorageReadiness()).toEqual({
      uploadReady: true,
      deliveryReady: true,
      separateBucketConfigured: true,
      usingFallbackCredentials: true,
      baseUrlConfigured: true,
      baseUrlSecure: true,
    });
  });

  it("rejects using the private assistance bucket as public media storage", () => {
    process.env.S3_REGION = "ap-south-1";
    process.env.S3_BUCKET = "same-bucket";
    process.env.S3_ACCESS_KEY_ID = "key";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    process.env.PUBLIC_MEDIA_S3_BUCKET = "same-bucket";
    process.env.PUBLIC_MEDIA_BASE_URL = "https://media.example.org";

    const status = getPublicMediaStorageReadiness();
    expect(status.separateBucketConfigured).toBe(false);
    expect(status.uploadReady).toBe(false);
    expect(status.deliveryReady).toBe(false);
  });

  it("allows storage readiness while blocking publication delivery without a safe HTTPS base URL", () => {
    process.env.S3_REGION = "ap-south-1";
    process.env.S3_BUCKET = "private-assistance";
    process.env.S3_ACCESS_KEY_ID = "key";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    process.env.PUBLIC_MEDIA_S3_BUCKET = "public-media";
    process.env.PUBLIC_MEDIA_BASE_URL = "http://media.example.org";

    const status = getPublicMediaStorageReadiness();
    expect(status.uploadReady).toBe(true);
    expect(status.baseUrlConfigured).toBe(true);
    expect(status.baseUrlSecure).toBe(false);
    expect(status.deliveryReady).toBe(false);
  });
});


describe("managed private document keys", () => {
  it("accepts only keys bound to the owning assistance request", () => {
    const requestId = "request-123";
    const key = "assistance/request-123/123e4567-e89b-12d3-a456-426614174000.pdf";
    expect(isManagedPrivateDocumentKey(key, requestId)).toBe(true);
    expect(isManagedPrivateDocumentKey(key, "request-456")).toBe(false);
  });

  it("rejects traversal, unsupported extensions and malformed ids", () => {
    const requestId = "request-123";
    expect(isManagedPrivateDocumentKey("assistance/request-123/../secret.pdf", requestId)).toBe(false);
    expect(isManagedPrivateDocumentKey("assistance/request-123/not-a-uuid.pdf", requestId)).toBe(false);
    expect(isManagedPrivateDocumentKey("assistance/request-123/123e4567-e89b-12d3-a456-426614174000.exe", requestId)).toBe(false);
  });
});

describe("storage cache boundary", () => {
  it("keeps private evidence non-cacheable while immutable public media is cacheable", () => {
    expect(PRIVATE_OBJECT_CACHE_CONTROL).toBe("private, no-store, max-age=0");
    expect(PUBLIC_MEDIA_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });
});


describe("readImageDimensions", () => {
  it("reads PNG IHDR dimensions", () => {
    const bytes = Buffer.alloc(24);
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes);
    bytes.writeUInt32BE(1080, 16);
    bytes.writeUInt32BE(1350, 20);
    expect(readImageDimensions(bytes, "image/png")).toEqual({ width: 1080, height: 1350 });
  });

  it("reads WebP VP8X dimensions", () => {
    const bytes = Buffer.alloc(30);
    bytes.write("RIFF", 0, "ascii");
    bytes.write("WEBP", 8, "ascii");
    bytes.write("VP8X", 12, "ascii");
    bytes.writeUIntLE(1079, 24, 3);
    bytes.writeUIntLE(1349, 27, 3);
    expect(readImageDimensions(bytes, "image/webp")).toEqual({ width: 1080, height: 1350 });
  });

  it("reads JPEG SOF dimensions without decoding image pixels", () => {
    const bytes = Buffer.from([
      0xff,0xd8,
      0xff,0xe0,0x00,0x04,0x00,0x00,
      0xff,0xc0,0x00,0x0b,0x08,0x05,0x46,0x04,0x38,0x03,0x01,0x11,0x00,
      0xff,0xd9,
    ]);
    expect(readImageDimensions(bytes, "image/jpeg")).toEqual({ width: 1080, height: 1350 });
  });

  it("fails closed for truncated, malformed or non-image input", () => {
    expect(readImageDimensions(Buffer.from([0x89,0x50]), "image/png")).toBeNull();
    expect(readImageDimensions(Buffer.from([0xff,0xd8,0xff,0xc0,0x00,0x02]), "image/jpeg")).toBeNull();
    expect(readImageDimensions(Buffer.from("%PDF-1.7"), "application/pdf")).toBeNull();
  });
});
