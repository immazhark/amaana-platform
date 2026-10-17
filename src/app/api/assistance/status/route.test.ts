import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readTextBodyWithLimit: vi.fn(),
  findUnique: vi.fn(),
  enforceTrackingRateLimit: vi.fn(),
  isSameOrigin: vi.fn(),
}));

vi.mock("@/lib/assistance", () => ({
  hashTrackingToken: () => "a".repeat(64),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {
    constructor(readonly maxBytes: number) { super(`Request body exceeds ${maxBytes} bytes`); }
  }
  class RequestBodyReadTimeoutError extends Error {}
  return {
    RequestBodyTooLargeError,
    RequestBodyReadTimeoutError,
    readTextBodyWithLimit: mocks.readTextBodyWithLimit,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: { assistanceRequest: { findUnique: mocks.findUnique } },
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: mocks.isSameOrigin, enforceTrackingRateLimit: mocks.enforceTrackingRateLimit }));

import { POST } from "./route";

describe("assistance tracking privacy and request bounds", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.enforceTrackingRateLimit.mockResolvedValue(true);
  });

  it("denies rate-limited private tracking before body parsing or case lookups", async () => {
    mocks.enforceTrackingRateLimit.mockResolvedValue(false);
    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST", body: "{}",
    }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(mocks.readTextBodyWithLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a foreign origin without consuming a tracking attempt", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const response = await POST(new Request("https://amaana.example/api/assistance/status", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(mocks.enforceTrackingRateLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("uses a separate tracking bucket on an eligible request and reveals nothing for unknown credentials", async () => {
    mocks.readTextBodyWithLimit.mockResolvedValue(JSON.stringify({
      reference: "AFR-123", token: "synthetic-secret-token-at-least-twenty-characters",
    }));
    mocks.findUnique.mockResolvedValue(null);
    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST", body: "{}",
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.enforceTrackingRateLimit).toHaveBeenCalledOnce();
    expect(mocks.readTextBodyWithLimit).toHaveBeenCalledWith(expect.any(Request), 8 * 1024, { timeoutMs: 15_000 });
    expect(mocks.findUnique).toHaveBeenCalledOnce();
  });

  it("fails closed when tracking rate-limit storage is unavailable", async () => {
    mocks.enforceTrackingRateLimit.mockRejectedValue(new Error("attempt ledger unavailable"));
    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST", body: "{}",
    }));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mocks.readTextBodyWithLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("reports a stalled tracking-body read as unavailable, not as an invalid credential", async () => {
    const { RequestBodyReadTimeoutError } = await import("@/lib/bounded-request-body");
    mocks.readTextBodyWithLimit.mockRejectedValueOnce(new RequestBodyReadTimeoutError());
    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST", body: "{}",
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Private request tracking is temporarily unavailable." });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("applies private response headers even when tracking credentials are invalid", async () => {
    mocks.readTextBodyWithLimit.mockResolvedValue(JSON.stringify({ reference: "AFR-1", token: "too-short" }));

    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST",
      body: "{}",
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized tracking payload before database lookup", async () => {
    const { RequestBodyTooLargeError } = await import("@/lib/bounded-request-body");
    mocks.readTextBodyWithLimit.mockRejectedValue(new RequestBodyTooLargeError(8192));

    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST",
      body: "oversized",
    }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
