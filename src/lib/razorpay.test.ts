import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRazorpayOrder, fetchRazorpayPayment, verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";

describe("Razorpay signatures", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "checkout-secret-value";
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret-value";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("verifies checkout signatures", () => {
    const signature = createHmac("sha256", "checkout-secret-value")
      .update("order_1|pay_1")
      .digest("hex");
    expect(verifyCheckoutSignature("order_1", "pay_1", signature)).toBe(true);
    expect(verifyCheckoutSignature("order_1", "pay_2", signature)).toBe(false);
  });

  it("verifies the raw webhook body", () => {
    const body = '{"event":"payment.captured"}';
    const signature = createHmac("sha256", "webhook-secret-value")
      .update(body)
      .digest("hex");
    expect(verifyWebhookSignature(body, signature)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, signature)).toBe(false);
  });

  it("creates INR orders through the authenticated server API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "order_1",
        amount: 50000,
        currency: "INR",
        receipt: "AFD-1",
        status: "created",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const order = await createRazorpayOrder({
      amountPaise: 50000,
      receipt: "AFD-1",
      appealId: "appeal_1",
      givingIntent: "GENERAL",
    });

    expect(order.id).toBe("order_1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/orders",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          amount: 50000,
          currency: "INR",
          receipt: "AFD-1",
          notes: { appealId: "appeal_1", givingIntent: "GENERAL" },
        }),
      }),
    );
  });

  it("fetches a payment for server-side verification", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "pay_1",
        order_id: "order_1",
        amount: 50000,
        currency: "INR",
        status: "captured",
        captured: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const payment = await fetchRazorpayPayment("pay_1");

    expect(payment.captured).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/payments/pay_1",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("aborts an unresponsive provider request at the configured deadline", async () => {
    const abortController = new AbortController();
    const deadlineSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(abortController.signal);
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("provider request aborted")), { once: true });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = fetchRazorpayPayment("pay_timeout");
    expect(deadlineSpy).toHaveBeenCalledWith(15_000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/payments/pay_timeout",
      expect.objectContaining({ signal: abortController.signal, cache: "no-store" }),
    );

    abortController.abort();
    await expect(result).rejects.toThrow("provider request aborted");
  });

  it("fails closed when Razorpay returns a gateway error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      json: async () => ({ error: "gateway timeout" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createRazorpayOrder({
        amountPaise: 50000,
        receipt: "AFD-FAIL",
        appealId: "appeal_1",
        givingIntent: "GENERAL",
      }),
    ).rejects.toThrow("Razorpay request failed with status 504");
  });

  it("propagates provider network failures instead of fabricating a payment result", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchRazorpayPayment("pay_network_failure"))
      .rejects.toThrow("network unavailable");
  });

  it("URL-encodes payment identifiers before server-side verification", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "pay/special",
        order_id: "order_1",
        amount: 50000,
        currency: "INR",
        status: "captured",
        captured: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchRazorpayPayment("pay/special");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/payments/pay%2Fspecial",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it.each([
    null,
    [],
    { id: "" },
    { id: 123 },
    { order_id: 123 },
    { amount: "50000" },
    { amount: -1 },
    { amount: 1.5 },
    { amount: Number.MAX_SAFE_INTEGER + 1 },
    { currency: null },
    { status: "" },
    { captured: "false" },
    { captured: 1 },
    { captured: null },
    { contact: 123 },
  ].map(invalid => ({ invalid })))("rejects malformed provider payment fields: %j", async ({ invalid }) => {
    const payment = {
      id: "pay_1", order_id: "order_1", amount: 50000,
      currency: "INR", status: "authorized", captured: false,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => invalid === null || Array.isArray(invalid)
        ? invalid : { ...payment, ...invalid },
    }));

    await expect(fetchRazorpayPayment("pay_1"))
      .rejects.toThrow("Invalid Razorpay payment response");
  });

  it.each(["created", "authorized", "captured", "refunded", "failed"])(
    "preserves valid %s responses and nullable provider fields",
    async status => {
      const payment = {
        id: "pay_1", order_id: null, amount: 50000, currency: "INR",
        status, captured: status === "captured", email: null, contact: null,
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payment }));
      await expect(fetchRazorpayPayment("pay_1")).resolves.toEqual(payment);
    },
  );

  it("does not disclose malformed provider data in validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ captured: "private-provider-data" }),
    }));
    await expect(fetchRazorpayPayment("pay_1"))
      .rejects.toThrow(/^Invalid Razorpay payment response$/);
  });
});
