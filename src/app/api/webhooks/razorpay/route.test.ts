import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  ensureCapturedDonationForRefund: vi.fn(),
  paymentEventFindUnique: vi.fn(),
  rootPaymentEventCreate: vi.fn(),
  uniqueConstraintError: vi.fn(),
  transactionRetry: vi.fn(),
  rootTransaction: vi.fn(),
  txDonationFindUnique: vi.fn(),
  txDonationUpdate: vi.fn(),
  txDonationUpdateMany: vi.fn(),
  txAppealFindUnique: vi.fn(),
  txAppealUpdate: vi.fn(),
  txPaymentEventCreate: vi.fn(),
  txNotificationCreate: vi.fn(),
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

vi.mock("@/lib/payment-event-audit", () => ({
  paymentEventAuditPayload: (payload: unknown) => payload,
}));

vi.mock("@/lib/payment-processing", () => ({
  captureDonation: vi.fn(),
  ensureCapturedDonationForRefund: mocks.ensureCapturedDonationForRefund,
}));

vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transactionRetry,
}));

vi.mock("@/lib/razorpay", () => ({
  verifyWebhookSignature: mocks.verifyWebhookSignature,
}));

vi.mock("@/lib/env", () => ({
  validateProductionEnvironment: () => undefined,
}));

vi.mock("@/lib/webhook-idempotency", () => ({
  isPrismaUniqueConstraintError: mocks.uniqueConstraintError,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.rootTransaction,
    paymentEvent: {
      findUnique: mocks.paymentEventFindUnique,
      create: mocks.rootPaymentEventCreate,
    },
  },
}));

import { POST } from "./route";

const decimal = (value: number) => ({
  mul: (factor: number) => ({ toNumber: () => value * factor }),
});

function webhookRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://amaana.example/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "signature",
      "x-razorpay-event-id": "evt_refund_001",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function refundPayload(amount = 2500) {
  return {
    event: "refund.processed",
    payload: {
      refund: {
        entity: {
          id: "rfnd_001",
          payment_id: "pay_001",
          amount,
          currency: "INR",
          status: "processed",
        },
      },
    },
  };
}

describe("Razorpay webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uniqueConstraintError.mockReturnValue(false);
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.paymentEventFindUnique.mockResolvedValue(null);
    mocks.ensureCapturedDonationForRefund.mockResolvedValue({
      donationId: "donation_1",
      matched: true,
      alreadyCaptured: true,
    });

    const tx = {
      donation: {
        findUnique: mocks.txDonationFindUnique,
        update: mocks.txDonationUpdate,
        updateMany: mocks.txDonationUpdateMany,
      },
      appeal: {
        findUnique: mocks.txAppealFindUnique,
        update: mocks.txAppealUpdate,
      },
      paymentEvent: {
        create: mocks.txPaymentEventCreate,
      },
      notification: {
        create: mocks.txNotificationCreate,
      },
    };

    mocks.rootTransaction.mockImplementation(async callback => callback(tx));
    mocks.transactionRetry.mockImplementation(async callback => callback(tx));
    mocks.txDonationFindUnique.mockResolvedValue({
      id: "donation_1",
      appealId: "appeal_1",
      amount: decimal(100),
      refundedAmount: decimal(0),
      donorEmail: "donor@example.test",
      referenceNumber: "AFD-2026-000001",
    });
    mocks.txAppealFindUnique.mockResolvedValue({
      status: "PUBLISHED",
      amountRaised: decimal(1_000),
      goalAmount: decimal(5_000),
      closesAt: null,
    });
    mocks.txPaymentEventCreate.mockResolvedValue({ id: "payment_event_1" });
    mocks.txDonationUpdate.mockResolvedValue({ id: "donation_1" });
    mocks.txAppealUpdate.mockResolvedValue({ id: "appeal_1" });
    mocks.txNotificationCreate.mockResolvedValue({ id: "notification_1" });
  });

  it("rejects an invalid signature before any event lookup or accounting", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(false);

    const response = await POST(webhookRequest(refundPayload()));

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Invalid signature");
    expect(mocks.paymentEventFindUnique).not.toHaveBeenCalled();
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate provider event without replaying refund accounting", async () => {
    mocks.paymentEventFindUnique.mockResolvedValue({ id: "existing_event", eventType: "refund.processed" });

    const response = await POST(webhookRequest(refundPayload()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
  });

  it("rejects reuse of a provider event id for a different event type", async () => {
    mocks.paymentEventFindUnique.mockResolvedValue({
      id: "existing_event",
      eventType: "payment.failed",
    });

    const response = await POST(webhookRequest(refundPayload()));

    expect(response.status).toBe(409);
    expect(await response.text()).toBe("Webhook event id conflict");
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["refund.processed", 200],
    ["payment.failed", 409],
  ])("handles a concurrent event insert with stored type %s", async (eventType, status) => {
    mocks.paymentEventFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "racing_event", eventType });
    mocks.uniqueConstraintError.mockReturnValue(true);
    mocks.transactionRetry.mockRejectedValueOnce({ code: "P2002" });

    const response = await POST(webhookRequest(refundPayload()));

    expect(response.status).toBe(status);
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("does not acknowledge an unrelated unique constraint failure", async () => {
    mocks.uniqueConstraintError.mockReturnValue(true);
    mocks.transactionRetry.mockRejectedValueOnce({ code: "P2002" });

    const response = await POST(webhookRequest(refundPayload()));

    expect(response.status).toBe(500);
  });

  it("records payment.failed without changing appeal accounting", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce({ id: "donation_failed_1", amount: decimal(25) });
    mocks.txDonationUpdateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_001",
            order_id: "order_failed_001",
            amount: 2500,
            currency: "INR",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_failed_001" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.txPaymentEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerEventId: "evt_failed_001",
        eventType: "payment.failed",
        donationId: "donation_failed_1",
      }),
    });
    expect(mocks.txDonationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "donation_failed_1",
        status: { in: ["CREATED", "AUTHORIZED"] },
      },
      data: {
        status: "FAILED",
        failedAt: expect.any(Date),
        providerPaymentId: "pay_failed_001",
      },
    });
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("rejects a failed-payment event whose amount does not match the local order", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce({ id: "donation_failed_1", amount: decimal(50) });

    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_wrong_amount",
            order_id: "order_failed_001",
            amount: 2500,
            currency: "INR",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_failed_wrong_amount" }));

    expect(response.status).toBe(500);
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["fractional", 2500.5],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1],
  ])("does not mutate a donation for an unsafe %s payment.failed amount", async (_label, amount) => {
    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_unsafe",
            order_id: "order_failed_unsafe",
            amount,
            currency: "INR",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": `evt_failed_unsafe_${String(amount).replace(/[^0-9]/g, "_")}` }));

    expect(response.status).toBe(200);
    expect(mocks.txDonationFindUnique).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "payment.failed",
      }),
    });
  });

  it("does not mutate a donation for a non-INR payment.failed event", async () => {
    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_usd",
            order_id: "order_failed_usd",
            amount: 2500,
            currency: "USD",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_failed_usd" }));

    expect(response.status).toBe(200);
    expect(mocks.txDonationFindUnique).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerEventId: "evt_failed_usd",
        eventType: "payment.failed",
      }),
    });
  });

  it("records an unmatched payment.failed event without mutating a donation", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce(null);

    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_unknown",
            order_id: "order_unknown",
            amount: 2500,
            currency: "INR",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_failed_unknown" }));

    expect(response.status).toBe(200);
    expect(mocks.txPaymentEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerEventId: "evt_failed_unknown",
        eventType: "payment.failed",
        donationId: undefined,
      }),
    });
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
  });

  it("reconciles an INR refund into donation, appeal, event and notification records", async () => {
    const response = await POST(webhookRequest(refundPayload(2500)));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });

    expect(mocks.ensureCapturedDonationForRefund).toHaveBeenCalledWith("pay_001");
    expect(mocks.txPaymentEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerEventId: "evt_refund_001",
        eventType: "refund.processed",
        donationId: "donation_1",
      }),
    });

    expect(mocks.txDonationUpdate).toHaveBeenCalledWith({
      where: { id: "donation_1" },
      data: {
        refundedAmount: { increment: 25 },
      },
    });

    expect(mocks.txAppealUpdate).toHaveBeenCalledWith({
      where: { id: "appeal_1" },
      data: {
        amountRaised: { decrement: 25 },
      },
    });

    expect(mocks.txNotificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        channel: "EMAIL",
        recipient: "donor@example.test",
        templateKey: "donation-refund-processed",
        donationId: "donation_1",
        payload: expect.objectContaining({
          referenceNumber: "AFD-2026-000001",
          refundAmount: "₹25",
          refundState: "partial refund",
        }),
      }),
    });
  });
});

