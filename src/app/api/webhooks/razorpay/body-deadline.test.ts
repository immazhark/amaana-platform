import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  findEvent: vi.fn(),
  createEvent: vi.fn(),
  captureDonation: vi.fn(),
  ensureCapturedDonationForRefund: vi.fn(),
  transactionRetry: vi.fn(),
  rootTransaction: vi.fn(),
  logServerError: vi.fn(),
}));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/razorpay", () => ({ verifyWebhookSignature: mocks.verifyWebhookSignature }));
vi.mock("@/lib/payment-processing", () => ({
  captureDonation: mocks.captureDonation,
  ensureCapturedDonationForRefund: mocks.ensureCapturedDonationForRefund,
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transactionRetry,
}));
vi.mock("@/lib/payment-event-audit", () => ({
  paymentEventAuditPayload: (event: unknown) => event,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.rootTransaction,
    paymentEvent: { findUnique: mocks.findEvent, create: mocks.createEvent },
  },
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.logServerError }));

import { POST } from "./route";

const endpoint = "https://amaanafoundation.org/api/webhooks/razorpay";
const privateResponseHeaders = (response: Response) => {
  expect(response.headers.get("cache-control")).toMatch(/no-store/i);
  expect(response.headers.get("retry-after")).toBe("60");
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.verifyWebhookSignature.mockReturnValue(true);
  mocks.findEvent.mockResolvedValue(null);
  mocks.createEvent.mockResolvedValue({ id: "synthetic-event" });
});
afterEach(() => vi.useRealTimers());

describe("Razorpay webhook ingress absolute deadline", () => {
  it("returns retryable 503 at 5 seconds for a never-ending stream even when cancellation hangs", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const request = new Request(endpoint, {
      method: "POST",
      headers: { "x-razorpay-signature": "synthetic-valid-signature", "content-type": "application/json" },
      body: new ReadableStream<Uint8Array>({ cancel }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    let response: Response | undefined;
    void POST(request).then(value => { response = value; });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(response).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(response?.status).toBe(503);
    expect(await response?.text()).toBe("Webhook body timed out");
    if (!response) throw new Error("Expected retryable webhook deadline response");
    privateResponseHeaders(response);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.findEvent).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.captureDonation).not.toHaveBeenCalled();
    expect(mocks.ensureCapturedDonationForRefund).not.toHaveBeenCalled();
    expect(mocks.transactionRetry).not.toHaveBeenCalled();
    expect(mocks.rootTransaction).not.toHaveBeenCalled();
  });

  it("does not reset the deadline when small body chunks arrive before completion", async () => {
    vi.useFakeTimers();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const request = new Request(endpoint, {
      method: "POST",
      headers: { "x-razorpay-signature": "synthetic-valid-signature", "content-type": "application/json" },
      body: new ReadableStream<Uint8Array>({
        start(stream) { controller = stream; },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    let response: Response | undefined;
    void POST(request).then(value => { response = value; });
    await vi.advanceTimersByTimeAsync(2_000);
    controller.enqueue(new Uint8Array([123]));
    await vi.advanceTimersByTimeAsync(2_000);
    controller.enqueue(new Uint8Array([34]));
    await vi.advanceTimersByTimeAsync(1_000);

    expect(response?.status).toBe(503);
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.captureDonation).not.toHaveBeenCalled();
  });

  it("preserves signed complete-event acknowledgement and durable idempotency record", async () => {
    const event = { event: "synthetic.nonfinancial", payload: {} };
    const response = await POST(new Request(endpoint, {
      method: "POST",
      headers: { "x-razorpay-signature": "synthetic-valid-signature", "content-type": "application/json" },
      body: JSON.stringify(event),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledOnce();
    expect(mocks.findEvent).toHaveBeenCalledOnce();
    expect(mocks.createEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventType: event.event }),
    });
  });

  it("retains 413 size enforcement before signature or database work", async () => {
    const response = await POST(new Request(endpoint, {
      method: "POST",
      headers: {
        "x-razorpay-signature": "synthetic-valid-signature",
        "content-type": "application/json",
        "content-length": String(256 * 1024 + 1),
      },
      body: "{}",
    }));
    expect(response.status).toBe(413);
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });
});
