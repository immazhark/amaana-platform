import { syntheticFundDesignation } from "@/test/fund-designation";
vi.mock("@/lib/donation-cache", () => ({ expireDonationViews: vi.fn() }));
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  ensureCapturedDonationForRefund: vi.fn(),
  captureDonation: vi.fn(),
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
  txRefundCreateMany: vi.fn(),
  txRefundFindUnique: vi.fn(),
  readTextBodyWithLimit: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  class RequestBodyReadTimeoutError extends Error {}
  return {
    RequestBodyTooLargeError,
    RequestBodyReadTimeoutError,
    readTextBodyWithLimit: mocks.readTextBodyWithLimit,
  };
});

vi.mock("@/lib/payment-event-audit", () => ({
  paymentEventAuditPayload: (payload: unknown) => payload,
}));

vi.mock("@/lib/payment-processing", () => ({
  captureDonation: mocks.captureDonation,
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

vi.mock("@/lib/webhook-idempotency", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/webhook-idempotency")>()),
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
import { expireDonationViews } from "@/lib/donation-cache";

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
    mocks.readTextBodyWithLimit.mockReset().mockImplementation(async (request: Request, maxBytes: number) => {
      const declared = Number(request.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) {
        const { RequestBodyTooLargeError } = await import("@/lib/bounded-request-body");
        throw new RequestBodyTooLargeError();
      }
      return request.text();
    });
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
      refundLedger: {
        createMany: mocks.txRefundCreateMany,
        findUnique: mocks.txRefundFindUnique,
      },
    };

    mocks.rootTransaction.mockImplementation(async callback => callback(tx));
    mocks.transactionRetry.mockImplementation(async callback => callback(tx));
    mocks.txDonationFindUnique.mockResolvedValue({
      id: "donation_1",
      appealId: "appeal_1",
      currency: "INR", amount: decimal(100),
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
    mocks.txRefundCreateMany.mockResolvedValue({ count: 1 });
    mocks.txRefundFindUnique.mockResolvedValue({
      providerRefundId: "rfnd_001",
      providerPaymentId: "pay_001",
      donationId: "donation_1",
      amount: decimal(25),
      currency: "INR",
    });
  });

  it("sets a fixed 15-second webhook body read deadline", async () => {
    await POST(webhookRequest({ event: "synthetic.audit", payload: {} }));
    expect(mocks.readTextBodyWithLimit).toHaveBeenCalledWith(
      expect.any(Request), 256 * 1024, { timeoutMs: 15_000 },
    );
  });

  it("rejects stalled unsigned webhook bodies with a retryable response and no provider or DB work", async () => {
    const { RequestBodyReadTimeoutError } = await import("@/lib/bounded-request-body");
    mocks.readTextBodyWithLimit.mockRejectedValueOnce(new RequestBodyReadTimeoutError());
    const response = await POST(webhookRequest({ event: "payment.captured" }));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.text()).toBe("Webhook read timed out");
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.paymentEventFindUnique).not.toHaveBeenCalled();
    expect(mocks.captureDonation).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
    expect(expireDonationViews).not.toHaveBeenCalled();
  });

  it("records committed capture event before cache refresh, so a cache outage is replayable", async () => {
    const captured = {
      event: "payment.captured",
      payload: { payment: { entity: {
        id: "pay_001", order_id: "order_001", amount: 50000,
        currency: "INR", status: "captured", captured: true,
      } } },
    };
    mocks.captureDonation.mockResolvedValue({ donationId: "donation_1" });
    mocks.rootPaymentEventCreate.mockResolvedValue({ id: "stored_capture_event" });
    vi.mocked(expireDonationViews).mockImplementationOnce(() => {
      throw new Error("synthetic post-commit cache outage");
    });

    const first = await POST(webhookRequest(captured, { "x-razorpay-event-id": "evt_capture_replay" }));
    expect(first.status).toBe(500);
    expect(mocks.captureDonation).toHaveBeenCalledExactlyOnceWith("order_001", "pay_001", 50000);
    expect(mocks.rootPaymentEventCreate).toHaveBeenCalledOnce();
    expect(mocks.rootPaymentEventCreate.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(expireDonationViews).mock.invocationCallOrder[0],
    );

    mocks.paymentEventFindUnique.mockResolvedValueOnce({
      id: "stored_capture_event", eventType: "payment.captured", payload: captured,
    });
    const replay = await POST(webhookRequest(captured, { "x-razorpay-event-id": "evt_capture_replay" }));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ received: true });
    expect(mocks.captureDonation).toHaveBeenCalledOnce();
    expect(mocks.rootPaymentEventCreate).toHaveBeenCalledOnce();
    expect(expireDonationViews).toHaveBeenCalledTimes(2);
  });

  it.each([
    { appealId: "appeal_1", fundId: null },
    { appealId: null, fundId: "approved_fund" },
  ])("refuses INR refund accounting for foreign donation %o", async destination => {
    const original = await mocks.txDonationFindUnique();
    mocks.txDonationFindUnique.mockResolvedValueOnce({ ...original, ...destination, givingIntent: "GENERAL", designationSnapshot: destination.fundId ? syntheticFundDesignation(destination.fundId) : null, currency: "USD" });
    const response = await POST(webhookRequest(refundPayload()));
    expect(response.status).toBe(500);
    expect(mocks.txRefundCreateMany).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("expires views only after a refund transaction has completed", async () => {
    const tx = mocks.transactionRetry.getMockImplementation()!;
    mocks.transactionRetry.mockImplementationOnce(async callback => {
      const result = await tx(callback);
      expect(expireDonationViews).not.toHaveBeenCalled();
      return result;
    });
    expect((await POST(webhookRequest(refundPayload()))).status).toBe(200);
    expect(expireDonationViews).toHaveBeenCalledOnce();
  });
  it("does not expire balances after a rolled-back refund transaction", async () => {
    mocks.transactionRetry.mockRejectedValueOnce(new Error("transaction rolled back"));
    expect((await POST(webhookRequest(refundPayload()))).status).toBe(500);
    expect(expireDonationViews).not.toHaveBeenCalled();
  });
  it("retries view expiry on verified replay after a post-commit cache failure", async () => {
    vi.mocked(expireDonationViews).mockImplementationOnce(() => { throw new Error("cache unavailable"); });
    expect((await POST(webhookRequest(refundPayload()))).status).toBe(500);
    mocks.paymentEventFindUnique.mockResolvedValueOnce({ id: "committed", eventType: "refund.processed", payload: refundPayload() });
    expect((await POST(webhookRequest(refundPayload()))).status).toBe(200);
    expect(expireDonationViews).toHaveBeenCalledTimes(2);
    expect(mocks.transactionRetry).toHaveBeenCalledOnce();
    expect(mocks.txDonationUpdate).toHaveBeenCalledOnce();
  });

  it("refunds an independently designated fund donation without touching any appeal", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce({
      id: "donation_fund", appealId: null, fundId: "approved_fund", givingIntent: "GENERAL", designationSnapshot: syntheticFundDesignation("approved_fund"),
      currency: "INR", amount: decimal(100), refundedAmount: decimal(0),
      donorEmail: "donor@example.test", referenceNumber: "AFD-FUND",
    });
    const response = await POST(webhookRequest(refundPayload(2500)));
    expect(response.status).toBe(200);
    expect(mocks.txRefundCreateMany).toHaveBeenCalledOnce();
    expect(mocks.txDonationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "donation_fund" },
      data: expect.objectContaining({ refundedAmount: { increment: 25 } }),
    }));
    expect(mocks.txAppealFindUnique).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).toHaveBeenCalledOnce();
  });

  it("does not refund fund money with an unverifiable original purpose", async () => {
    const original = await mocks.txDonationFindUnique();
    mocks.txDonationFindUnique.mockResolvedValueOnce({ ...original, appealId: null, fundId: "fund", givingIntent: "GENERAL", designationSnapshot: null });
    expect((await POST(webhookRequest(refundPayload()))).status).toBe(500);
    expect(mocks.txRefundCreateMany).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("does not acknowledge a fund refund larger than the remaining captured amount", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce({
      id: "donation_fund", appealId: null, fundId: "approved_fund", givingIntent: "GENERAL", designationSnapshot: syntheticFundDesignation("approved_fund"),
      currency: "INR", amount: decimal(100), refundedAmount: decimal(0),
      donorEmail: "donor@example.test", referenceNumber: "AFD-FUND",
    });
    const response = await POST(webhookRequest(refundPayload(15_000)));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
  });

  it("rejects refund accounting with two destinations before ledger writes", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce({
      id: "donation_mixed", appealId: "appeal_1", fundId: "approved_fund", givingIntent: "GENERAL", designationSnapshot: syntheticFundDesignation("approved_fund"),
      currency: "INR", amount: decimal(100), refundedAmount: decimal(0),
    });
    const response = await POST(webhookRequest(refundPayload(2500)));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mocks.txRefundCreateMany).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
  });

  it.each([
    { id: "" },
    { id: "invalid" },
    { order_id: "" },
    { order_id: "invalid" },
    { status: "authorized" },
    { status: "failed" },
    { captured: false },
    { currency: "USD" },
    { amount: 0 },
    { amount: -10 },
    { amount: 125.5 },
    { amount: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects malformed payment.captured entities before persistence: %j", async fields => {
    const response = await POST(webhookRequest({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_123",
            order_id: "order_123",
            currency: "INR",
            amount: 50_000,
            status: "captured",
            ...fields,
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_bad_capture" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid captured payment entity");
    expect(mocks.captureDonation).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
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
    mocks.paymentEventFindUnique.mockResolvedValue({ id: "existing_event", eventType: "refund.processed", payload: refundPayload() });

    const response = await POST(webhookRequest(refundPayload()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
  });

  it("rejects a reused refund event ID with a different financial amount", async () => {
    mocks.paymentEventFindUnique.mockResolvedValue({
      id: "existing_event",
      eventType: "refund.processed",
      payload: refundPayload(2500),
    });

    const response = await POST(webhookRequest(refundPayload(3000)));

    expect(response.status).toBe(409);
    expect(await response.text()).toBe("Webhook event id conflict");
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
  });

  it("rejects a raced refund-event insert when the winning row has different financial details", async () => {
    mocks.paymentEventFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "racing_event",
        eventType: "refund.processed",
        payload: refundPayload(2500),
      });
    mocks.uniqueConstraintError.mockReturnValue(true);
    mocks.transactionRetry.mockRejectedValueOnce({ code: "P2002" });

    const response = await POST(webhookRequest(refundPayload(3000)));

    expect(response.status).toBe(409);
    expect(await response.text()).toBe("Webhook event id conflict");
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("rejects reuse of a provider event id for a different event type", async () => {
    mocks.paymentEventFindUnique.mockResolvedValue({
      id: "existing_event",
      eventType: "payment.failed",
      payload: refundPayload(),
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
      .mockResolvedValueOnce({ id: "racing_event", eventType, payload: refundPayload() });
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
            id: "pay_failed001",
            order_id: "order_failed001",
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
        OR: [
          { status: "CREATED" },
          { status: "AUTHORIZED", providerPaymentId: "pay_failed001" },
        ],
      },
      data: {
        status: "FAILED",
        failedAt: expect.any(Date),
        providerPaymentId: "pay_failed001",
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
            id: "pay_failedwrongamount",
            order_id: "order_failed001",
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
            id: "pay_failedunsafe",
            order_id: "order_failedunsafe",
            amount,
            currency: "INR",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": `evt_failed_unsafe_${String(amount).replace(/[^0-9]/g, "_")}` }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid payment entity");
    expect(mocks.txDonationFindUnique).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
  });

  it("does not mutate a donation for a non-INR payment.failed event", async () => {
    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failedusd",
            order_id: "order_failedusd",
            amount: 2500,
            currency: "USD",
            status: "failed",
          },
        },
      },
    }, { "x-razorpay-event-id": "evt_failed_usd" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid payment entity");
    expect(mocks.txDonationFindUnique).not.toHaveBeenCalled();
    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
  });

  it("records an unmatched payment.failed event without mutating a donation", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce(null);

    const response = await POST(webhookRequest({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failedunknown",
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

  it("records a new event for an existing refund without repeating accounting or notification", async () => {
    mocks.txRefundCreateMany.mockResolvedValue({ count: 0 });
    const response = await POST(webhookRequest(refundPayload(), { "x-razorpay-event-id": "evt_different" }));
    expect(response.status).toBe(200);
    expect(mocks.txPaymentEventCreate).toHaveBeenCalledOnce();
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("rejects conflicting details for an existing refund identity", async () => {
    mocks.txRefundCreateMany.mockResolvedValue({ count: 0 });
    const response = await POST(webhookRequest(refundPayload(3000)));
    expect(response.status).toBe(500);
    expect(mocks.txDonationUpdate).not.toHaveBeenCalled();
  });

  it.each(["failed", "pending", "created"])(
    "rejects refund.processed with contradictory provider status %s before accounting",
    async status => {
      const payload = refundPayload();
      const response = await POST(webhookRequest({
        ...payload,
        payload: { refund: { entity: { ...payload.payload.refund.entity, status } } },
      }));

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid refund entity");
      expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
      expect(mocks.transactionRetry).not.toHaveBeenCalled();
      expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
    },
  );

  it.each(["", "invalid", null])("rejects a missing or malformed refund id %s", async id => {
    const payload = refundPayload();
    const response = await POST(webhookRequest({
      ...payload,
      payload: { refund: { entity: { ...payload.payload.refund.entity, id } } },
    }));
    expect(response.status).toBe(400);
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
    expect(mocks.rootPaymentEventCreate).not.toHaveBeenCalled();
  });

  it("does not acknowledge an unmatched refund as accounted", async () => {
    mocks.txDonationFindUnique.mockResolvedValueOnce(null);
    const response = await POST(webhookRequest(refundPayload()));
    expect(response.status).toBe(500);
    expect(mocks.txRefundCreateMany).not.toHaveBeenCalled();
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

