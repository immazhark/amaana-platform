import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  donationCreate: vi.fn(),
  createRazorpayOrder: vi.fn(),
  donationSafeParse: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findFirst: mocks.findFirst },
    donation: { create: mocks.donationCreate },
  },
}));
vi.mock("@/lib/donations", () => ({
  createDonationReference: () => "SYNTHETIC-ORDER",
  createReceiptToken: () => "synthetic-receipt-token",
  donationSchema: { safeParse: mocks.donationSafeParse },
  hashReceiptToken: () => "synthetic-hash",
  isDonationAmountAllowedForRemaining: () => true,
  MIN_DONATION_AMOUNT: 10,
}));
vi.mock("@/lib/razorpay", () => ({
  createRazorpayOrder: mocks.createRazorpayOrder,
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceDonationRateLimit: mocks.enforceDonationRateLimit,
}));
vi.mock("@/lib/env", () => ({
  validateProductionEnvironment: () => undefined,
}));
vi.mock("@/lib/public-environment", () => ({
  canExposePublicAppeal: () => true,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.enforceDonationRateLimit.mockResolvedValue(true);
});

afterEach(() => vi.useRealTimers());

describe("Razorpay order JSON absolute read deadline", () => {
  it("returns private 503 after five seconds when cancellation never settles, without provider work", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const request = new Request("https://amaanafoundation.org/api/donations/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: new ReadableStream<Uint8Array>({ cancel }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    let response: Response | undefined;
    void POST(request).then(value => { response = value; });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(response).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({
      error: "Donation request timed out. Please try again.",
    });
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(response?.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response?.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.enforceDonationRateLimit).toHaveBeenCalledOnce();
    expect(mocks.donationSafeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("does not reset the elapsed read deadline for small arriving chunks", async () => {
    vi.useFakeTimers();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const request = new Request("https://amaanafoundation.org/api/donations/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: new ReadableStream<Uint8Array>({
        start(stream) { controller = stream; },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    let response: Response | undefined;
    void POST(request).then(value => { response = value; });
    for (let second = 0; second < 4; second++) {
      await vi.advanceTimersByTimeAsync(1_000);
      controller.enqueue(new Uint8Array([123]));
    }
    await vi.advanceTimersByTimeAsync(1_000);
    expect(response?.status).toBe(503);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("keeps invalid, complete JSON a client error without provider work", async () => {
    const response = await POST(new Request("https://amaanafoundation.org/api/donations/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toMatch(/private/i);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
});
