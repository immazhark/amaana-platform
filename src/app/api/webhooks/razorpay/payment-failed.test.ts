vi.mock("@/lib/donation-cache", () => ({ expireDonationViews: vi.fn() }));
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventFindUnique: vi.fn(),
  eventCreate: vi.fn(),
  transaction: vi.fn(),
  donationFindUnique: vi.fn(),
  donationUpdateMany: vi.fn(),
  captureDonation: vi.fn(),
  ensureCapturedDonationForRefund: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentEvent: { findUnique: mocks.eventFindUnique, create: mocks.eventCreate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/payment-processing", () => ({
  captureDonation: mocks.captureDonation,
  ensureCapturedDonationForRefund: mocks.ensureCapturedDonationForRefund,
}));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

const secret = "synthetic-failed-payment-webhook-secret";
const entity = { id: "pay_123", order_id: "order_123", amount: 50000, currency: "INR", status: "failed" };

function signedRequest(payment: object, signatureOverride?: string) {
  const body = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: payment } } });
  return new Request("https://amaana.example/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-event-id": "evt_failed_synthetic",
      "x-razorpay-signature": signatureOverride ?? createHmac("sha256", secret).update(body).digest("hex"),
    },
    body,
  });
}

describe("failed payment identity before persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    mocks.eventFindUnique.mockResolvedValue(null);
    mocks.donationFindUnique.mockResolvedValue({
      id: "donation_123", amount: { mul: () => ({ toNumber: () => 50000 }) },
    });
    mocks.transaction.mockImplementation(async callback => callback({
      donation: { findUnique: mocks.donationFindUnique, updateMany: mocks.donationUpdateMany },
      paymentEvent: { create: mocks.eventCreate },
    }));
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { id: undefined }, { id: null }, { id: "" }, { id: " \t\n" },
    { id: 123 }, { id: false }, { id: {} }, { id: [] },
    { id: "invalid" }, { id: "pay_" }, { id: "pay_a b" },
    { order_id: undefined }, { order_id: null }, { order_id: "" },
    { order_id: "invalid" }, { order_id: "order_" }, { order_id: "order_a b" },
    { amount: undefined }, { amount: null }, { amount: 0 }, { amount: -1 }, { amount: 1.5 },
    { currency: undefined }, { currency: null }, { currency: "USD" },
    { status: "captured" }, { status: "authorized" }, { captured: true },
  ])("rejects a signed failure with unusable payment identity: %j", async invalid => {
    const response = await POST(signedRequest({ ...entity, ...invalid }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid payment entity");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.eventCreate).not.toHaveBeenCalled();
    expect(mocks.donationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.captureDonation).not.toHaveBeenCalled();
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
  });

  it("keeps a valid signed failure bound to its provider identity", async () => {
    const response = await POST(signedRequest(entity));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.donationUpdateMany).toHaveBeenCalledWith({
      where: { id: "donation_123", OR: [
        { status: "CREATED" },
        { status: "AUTHORIZED", providerPaymentId: "pay_123" },
      ] },
      data: { status: "FAILED", failedAt: expect.any(Date), providerPaymentId: "pay_123" },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({ data: {
      providerEventId: "evt_failed_synthetic", eventType: "payment.failed", donationId: "donation_123",
      payload: { event: "payment.failed", payment: entity },
    } });
  });

  it("acknowledges a persisted duplicate without replaying its failure update", async () => {
    mocks.eventFindUnique.mockResolvedValue({ id: "event_123", eventType: "payment.failed", payload: { event: "payment.failed", payment: entity } });

    expect((await POST(signedRequest(entity))).status).toBe(200);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.donationUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before lookup or mutation", async () => {
    expect((await POST(signedRequest(entity, "invalid-signature"))).status).toBe(401);
    expect(mocks.eventFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.donationUpdateMany).not.toHaveBeenCalled();
  });
});
