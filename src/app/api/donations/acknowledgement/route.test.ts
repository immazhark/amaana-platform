import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  enforceAcknowledgementRateLimit: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  class RequestBodyReadTimeoutError extends Error {}
  return {
    RequestBodyTooLargeError,
    RequestBodyReadTimeoutError,
    readTextBodyWithLimit: async (request: Request, maxBytes: number) => {
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
