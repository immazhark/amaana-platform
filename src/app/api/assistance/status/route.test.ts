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

  it("reports body-stream transport failure as temporary unavailability, not an invalid private token", async () => {
    mocks.readTextBodyWithLimit.mockRejectedValueOnce(new Error("synthetic stream interrupted"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("keeps malformed but completely read JSON privacy-indistinguishable from an invalid tracking token", async () => {
    mocks.readTextBodyWithLimit.mockResolvedValueOnce("not-json");
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBeNull();
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

describe("applicant tracking never carries a rejection reason or any internal review detail (assistance queue brief, section 11)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.enforceTrackingRateLimit.mockResolvedValue(true);
    mocks.readTextBodyWithLimit.mockResolvedValue(JSON.stringify({ reference: "AF-2026-123456", token: "t".repeat(30) }));
  });

  const rejectedRecord = {
    trackingTokenHash: "a".repeat(64), status: "REJECTED", createdAt: new Date("2026-11-20T00:00:00Z"), updatedAt: new Date("2026-11-22T04:10:00Z"),
    // Everything below must never reach the applicant, even if the database were asked for it.
    internalNotes: "PRIVATE-NOTE", rejections: [{ reason: "PRIVATE-REJECTION-REASON", rejectedBy: { name: "Reviewer" } }],
    verification: { verificationSummary: "PRIVATE-SUMMARY", decision: "DECLINED" },
  };

  it("asks the database for the tracking fields only, never the rejections, notes or verification", async () => {
    mocks.findUnique.mockResolvedValue(rejectedRecord);
    await POST(new Request("https://amaana.example/api/assistance/status", { method: "POST", body: "{}" }));
    const query = mocks.findUnique.mock.calls[0]![0];
    expect(Object.keys(query.select).sort()).toEqual(["createdAt", "status", "trackingTokenHash", "updatedAt"]);
    expect(query.include).toBeUndefined();
  });

  it("tells a rejected applicant the status and the timestamps and nothing else", async () => {
    mocks.findUnique.mockResolvedValue(rejectedRecord);
    const response = await POST(new Request("https://amaana.example/api/assistance/status", { method: "POST", body: "{}" }));
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ found: true, status: "REJECTED", createdAt: "2026-11-20T00:00:00.000Z", updatedAt: "2026-11-22T04:10:00.000Z" });
    for (const secret of ["PRIVATE-NOTE", "PRIVATE-REJECTION-REASON", "PRIVATE-SUMMARY", "Reviewer", "DECLINED"]) expect(text).not.toContain(secret);
  });
});
