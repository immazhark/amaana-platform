import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createReceiptDownloadGrant, openReceiptDownloadGrant, RECEIPT_DOWNLOAD_GRANT_TTL_SECONDS } from "./receipt-download-grant";

const reference = "AFD-2026-12345678";
const token = "synthetic-private-token-012345678901234";
const now = 1_792_022_400_000;
const KEY = "a1".repeat(32);

beforeEach(() => vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", KEY));
afterEach(() => vi.unstubAllEnvs());

describe("short-lived private receipt download grants", () => {
  it("round-trips the reference and credential without exposing either", () => {
    const grant = createReceiptDownloadGrant({ reference, token }, now);
    expect(grant).toMatch(/^rd1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(grant).not.toContain(reference);
    expect(grant).not.toContain(token);
    expect(openReceiptDownloadGrant(grant, now + 1)).toEqual({ reference, token });
    expect(RECEIPT_DOWNLOAD_GRANT_TTL_SECONDS).toBe(300);
  });
  it("expires after five minutes", () => {
    const grant = createReceiptDownloadGrant({ reference, token }, now);
    expect(openReceiptDownloadGrant(grant, now + 300_000 - 1)).toEqual({ reference, token });
    expect(openReceiptDownloadGrant(grant, now + 300_000)).toBeNull();
  });
  it("rejects grants minted beyond allowed clock skew", () => {
    expect(openReceiptDownloadGrant(createReceiptDownloadGrant({ reference, token }, now), now - 30_001)).toBeNull();
  });
  it("rejects tampered nonce, payload and authentication tag", () => {
    const parts = createReceiptDownloadGrant({ reference, token }, now).split(".");
    for (const index of [1, 2, 3]) {
      const altered = [...parts];
      altered[index] = (altered[index]!.startsWith("a") ? "b" : "a") + altered[index]!.slice(1);
      expect(openReceiptDownloadGrant(altered.join("."), now)).toBeNull();
    }
  });
  it("invalidates active grants after encryption key rotation", () => {
    const grant = createReceiptDownloadGrant({ reference, token }, now);
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "b2".repeat(32));
    expect(openReceiptDownloadGrant(grant, now)).toBeNull();
  });
  it("does not mint with missing or malformed encryption keys", () => {
    for (const value of [undefined, "short", "xyz".repeat(22)]) {
      vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", value);
      expect(() => createReceiptDownloadGrant({ reference, token }, now)).toThrow(/not configured/);
    }
  });
  it.each([null, {}, "", "v1.some.value", "x".repeat(2000), "rd1.@@.@@.@@"])(
    "rejects malformed grant %s", grant => {
      expect(openReceiptDownloadGrant(grant, now)).toBeNull();
    },
  );
  it.each(["short", "has whitespace 12345", "x".repeat(81)])(
    "rejects unsafe reference", bad => {
      expect(() => createReceiptDownloadGrant({ reference: bad, token }, now)).toThrow();
    },
  );
  it.each(["short", "has whitespace".repeat(5), "x".repeat(301)])(
    "rejects invalid donor token", bad => {
      expect(() => createReceiptDownloadGrant({ reference, token: bad }, now)).toThrow();
    },
  );
  it("issues independent ciphertext for each request", () => {
    expect(createReceiptDownloadGrant({ reference, token }, now))
      .not.toBe(createReceiptDownloadGrant({ reference, token }, now));
  });
});
