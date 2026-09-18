import { describe, expect, it } from "vitest";
import {
  isRetryableEmailProviderResponse,
  notificationIdempotencyKey,
  notificationRetryDelayMs,
} from "./notifications";

describe("notification delivery reliability", () => {
  it("derives a stable provider idempotency key from the notification record", () => {
    expect(notificationIdempotencyKey("cm123")).toBe("amaana-notification/cm123");
    expect(notificationIdempotencyKey("cm123")).toBe(notificationIdempotencyKey("cm123"));
    expect(notificationIdempotencyKey("cm123")).not.toBe(notificationIdempotencyKey("cm124"));
  });

  it("uses bounded exponential retry delays", () => {
    expect(notificationRetryDelayMs(1)).toBe(5 * 60 * 1000);
    expect(notificationRetryDelayMs(2)).toBe(15 * 60 * 1000);
    expect(notificationRetryDelayMs(3)).toBe(45 * 60 * 1000);
    expect(notificationRetryDelayMs(4)).toBe(135 * 60 * 1000);
    expect(notificationRetryDelayMs(5)).toBe(135 * 60 * 1000);
    expect(() => notificationRetryDelayMs(0)).toThrow("positive integer");
  });

  it("retries only transient provider failures and concurrent idempotency conflicts", () => {
    for (const status of [408, 425, 429, 500, 502, 503]) {
      expect(isRetryableEmailProviderResponse(status), String(status)).toBe(true);
    }
    expect(isRetryableEmailProviderResponse(409, "concurrent_idempotent_requests")).toBe(true);
    expect(isRetryableEmailProviderResponse(409, "invalid_idempotent_request")).toBe(false);
    expect(isRetryableEmailProviderResponse(409)).toBe(false);

    for (const status of [400, 401, 403, 404, 422]) {
      expect(isRetryableEmailProviderResponse(status), String(status)).toBe(false);
    }
  });
});
