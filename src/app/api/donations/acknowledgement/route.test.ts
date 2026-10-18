import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  enforceAcknowledgementRateLimit: vi.fn(),
  readBodyError: undefined as Error | undefined,
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  class RequestBodyReadTimeoutError extends Error {}
  return {
    RequestBodyTooLargeError,
    RequestBodyReadTimeoutError,
    readTextBodyWithLimit: async (request: Request, maxBytes: number) => {
      if (mocks.readBodyError) throw mocks.readBodyError;
      const declared = Number(request.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError();
      return request.text();
    },
  };
});

vi.mock("@/lib/donations", () => ({
  getDonationAcknowledgementPresentation: vi.fn(),
  hashReceiptToken: () => "0".repeat(64),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceAcknowledgementRateLimit: mocks.enforceAcknowledgementRateLimit,
}));

import { POST } from "./route";

function acknowledgementRequest(headers?: HeadersInit) {
  return new Request("https://amaana.example/api/donations/acknowledgement", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      reference: "AFD-STAGING-REFUNDED",
      token: "receipt-token-at-least-twenty-characters",
    }),
  });
}

describe("private donation acknowledgement request bounds", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.enforceAcknowledgementRateLimit.mockResolvedValue(true);
    mocks.readBodyError = undefined;
  });

  it("rejects excessive valid receipt lookups before donation query", async () => {
    mocks.enforceAcknowledgementRateLimit.mockResolvedValue(false);
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.enforceAcknowledgementRateLimit).toHaveBeenCalledTimes(1);
  });

  it("uses a separate allowance for eligible lookups without exposing whether a reference exists", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.enforceAcknowledgementRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });



  it("treats receipt lookup database outages as private temporary failure, not missing receipt", async () => {
    mocks.findUnique.mockRejectedValueOnce(new Error("synthetic private database outage"));
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ found: false });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    expect(mocks.findUnique).toHaveBeenCalledOnce();
  });

  it("fails closed when the private lookup rate-limit ledger is unavailable", async () => {
    mocks.enforceAcknowledgementRateLimit.mockRejectedValueOnce(new Error("synthetic rate ledger failure"));
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("does not incorrectly label interrupted request bodies as invalid receipt credentials", async () => {
    mocks.readBodyError = new TypeError("synthetic connection reset");
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.enforceAcknowledgementRateLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("keeps a fully read but malformed JSON receipt request indistinguishable from invalid credentials", async () => {
    const request = new Request("https://amaana.example/api/donations/acknowledgement", {
      method: "POST", body: "{not-valid-json",
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    expect(response.headers.get("retry-after")).toBeNull();
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized acknowledgement payload before donation lookup", async () => {
    const response = await POST(acknowledgementRequest({ "Content-Length": String(8 * 1024 + 1) }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
