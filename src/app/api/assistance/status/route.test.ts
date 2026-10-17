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
  class RequestBodyTooLargeError extends Error { constructor(maxBytes: number) { super(String(maxBytes)); } }
  class RequestBodyReadTimeoutError extends Error { constructor() { super("Body read timed out"); } }
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

  const request = () => new Request("https://amaana.example/api/assistance/status", { method: "POST", body: "{}" });

  it("rejects exhausted tracking quota before reading payload or case records", async () => {
    mocks.enforceTrackingRateLimit.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.readTextBodyWithLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("fails closed with temporary unavailability if the quota ledger fails", async () => {
    mocks.enforceTrackingRateLimit.mockRejectedValue(new Error("synthetic ledger outage"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.readTextBodyWithLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a foreign origin before consuming quota", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.enforceTrackingRateLimit).not.toHaveBeenCalled();
    expect(mocks.readTextBodyWithLimit).not.toHaveBeenCalled();
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

  it("returns generic private 503 and Retry-After when the body read expires", async () => {
    const { RequestBodyReadTimeoutError } = await import("@/lib/bounded-request-body");
    mocks.readTextBodyWithLimit.mockRejectedValueOnce(new RequestBodyReadTimeoutError());

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.readTextBodyWithLimit).toHaveBeenCalledWith(expect.any(Request), 8 * 1024, { timeoutMs: 5_000 });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("reports private temporary unavailability on case-record database failure instead of marking credentials invalid", async () => {
    mocks.readTextBodyWithLimit.mockResolvedValue(JSON.stringify({
      reference: "AFR-SYNTHETIC-123",
      token: "synthetic-private-tracking-token",
    }));
    mocks.findUnique.mockRejectedValueOnce(new Error("synthetic database outage"));

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.enforceTrackingRateLimit).toHaveBeenCalledOnce();
    expect(mocks.findUnique).toHaveBeenCalledOnce();
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
