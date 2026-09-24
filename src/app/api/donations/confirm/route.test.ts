import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  captureDonation: vi.fn(),
  fetchRazorpayPayment: vi.fn(),
  verifyCheckoutSignature: vi.fn(),
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
  hashReceiptToken: () => "hashed-receipt-token",
}));

vi.mock("@/lib/payment-processing", () => ({
  captureDonation: mocks.captureDonation,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  fetchRazorpayPayment: mocks.fetchRazorpayPayment,
  verifyCheckoutSignature: mocks.verifyCheckoutSignature,
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
}));

vi.mock("@/lib/env", () => ({
  validateProductionEnvironment: () => undefined,
}));

import { POST } from "./route";

function confirmationRequest(headers?: HeadersInit) {
  return new Request("https://amaana.example/api/donations/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "signature",
      receiptToken: "receipt-token-at-least-twenty-characters",
    }),
  });
}

function storedDonation() {
  return {
    id: "donation_123",
    amount: { mul: () => ({ toNumber: () => 50000 }) },
    receiptTokenHash: "hashed-receipt-token",
    referenceNumber: "AMN-123",
    status: "CREATED",
  };
}

describe("donation confirmation persisted status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyCheckoutSignature.mockReturnValue(true);
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.fetchRazorpayPayment.mockResolvedValue({
      id: "pay_123",
      order_id: "order_123",
      amount: 50000,
      currency: "INR",
      status: "authorized",
      captured: false,
    });
  });

  it.each(["CAPTURED", "REFUNDED"] as const)(
    "returns %s when another reconciliation path already persisted that state",
    async persistedStatus => {
      mocks.findUnique
        .mockResolvedValueOnce(storedDonation())
        .mockResolvedValueOnce({ status: persistedStatus });

      const response = await POST(confirmationRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ referenceNumber: "AMN-123", status: persistedStatus });
      expect(mocks.updateMany).toHaveBeenCalledTimes(1);
      expect(mocks.captureDonation).not.toHaveBeenCalled();
    },
  );

  it("keeps payment confirmation responses private and non-indexable", async () => {
    mocks.findUnique
      .mockResolvedValueOnce(storedDonation())
      .mockResolvedValueOnce({ status: "AUTHORIZED" });

    const response = await POST(confirmationRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
  });

  it("rejects an oversized confirmation payload before payment verification", async () => {
    const response = await POST(confirmationRequest({ "Content-Length": String(32 * 1024 + 1) }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ error: "Payment confirmation payload is too large." });
    expect(mocks.verifyCheckoutSignature).not.toHaveBeenCalled();
    expect(mocks.fetchRazorpayPayment).not.toHaveBeenCalled();
  });

  it("does not authorize a provider payment whose amount differs from the stored donation", async () => {
    mocks.findUnique.mockResolvedValueOnce(storedDonation());
    mocks.fetchRazorpayPayment.mockResolvedValueOnce({
      id: "pay_123",
      order_id: "order_123",
      amount: 49900,
      currency: "INR",
      status: "authorized",
      captured: false,
    });

    const response = await POST(confirmationRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Payment is being verified. Please retain your payment confirmation." });
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.captureDonation).not.toHaveBeenCalled();
  });
});
