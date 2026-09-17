import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  captureDonation: vi.fn(),
  fetchRazorpayPayment: vi.fn(),
  verifyCheckoutSignature: vi.fn(),
}));

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

function confirmationRequest() {
  return new Request("https://amaana.example/api/donations/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "signature",
      receiptToken: "receipt-token-at-least-twenty-characters",
    }),
  });
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
        .mockResolvedValueOnce({
          id: "donation_123",
          receiptTokenHash: "hashed-receipt-token",
          referenceNumber: "AMN-123",
          status: "CREATED",
        })
        .mockResolvedValueOnce({ status: persistedStatus });

      const response = await POST(confirmationRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ referenceNumber: "AMN-123", status: persistedStatus });
      expect(mocks.updateMany).toHaveBeenCalledTimes(1);
      expect(mocks.captureDonation).not.toHaveBeenCalled();
    },
  );
});
