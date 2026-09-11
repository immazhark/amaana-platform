import { afterEach, describe, expect, it } from "vitest";
import { getPublicMediaStorageReadiness } from "./storage";

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
