import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
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
