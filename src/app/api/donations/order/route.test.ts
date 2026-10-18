import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  createRazorpayOrder: vi.fn(),
  safeParse: vi.fn(),
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
  createDonationReference: () => "AMN-123",
  createReceiptToken: () => "receipt-token",
  donationSchema: { safeParse: mocks.safeParse },
  hashReceiptToken: () => "hashed-token",
  isDonationAmountAllowedForRemaining: () => true,
  MIN_DONATION_AMOUNT: 10,
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceDonationRateLimit: mocks.enforceDonationRateLimit,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findFirst: mocks.findFirst },
    donation: { create: mocks.create, findUnique: mocks.findUnique },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  createRazorpayOrder: mocks.createRazorpayOrder,
}));

vi.mock("@/lib/env", () => ({
  validateProductionEnvironment: () => undefined,
}));

vi.mock("@/lib/public-environment", () => ({
  canExposePublicAppeal: () => true,
}));

import { POST } from "./route";

describe("donation order request bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
  });

  it("rejects Zakat intent when the appeal has not been explicitly reviewed as eligible", async () => {
    mocks.safeParse.mockReturnValue({
      success: true,
      data: {
        appealId: "clx1234567890abcdef123456",
        donorName: "Test Donor",
        donorEmail: "donor@example.com",
        donorPhone: "",
        amount: 500,
        givingIntent: "ZAKAT",
        isAnonymous: false,
        domesticConfirmed: true,
      },
    });
    mocks.findFirst.mockResolvedValue({
      id: "appeal_1",
      slug: "appeal-1",
      title: "Appeal 1",
      status: "PUBLISHED",
      goalAmount: 1000,
      amountRaised: 100,
      closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "UNREVIEWED" } },
    });

    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not currently marked as Zakat-eligible/i);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps checkout order responses private even when validation fails", async () => {
    mocks.safeParse.mockReturnValue({ success: false, error: { flatten: () => ({ fieldErrors: {} }) } });

    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("retains a legitimate whole-rupee Razorpay checkout for a paise-accurate balance", async () => {
    mocks.safeParse.mockReturnValue({
      success: true,
      data: {
        appealId: "clx1234567890abcdef123456",
        donorName: "Test Donor", donorEmail: "donor@example.com",
        donorPhone: "", amount: 500, givingIntent: "GENERAL",
        isAnonymous: false, domesticConfirmed: true,
      },
    });
    mocks.findFirst.mockResolvedValue({
      id: "appeal_1", slug: "appeal-1", title: "Appeal 1",
      status: "PUBLISHED", amountRaised: 100.3, goalAmount: 1000,
      closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "UNREVIEWED" } },
    });
    mocks.createRazorpayOrder.mockResolvedValue({
      id: "order_good123", amount: 50_000, currency: "INR",
      receipt: "AMN-123", status: "created",
    });
    mocks.create.mockResolvedValue({
      id: "donation_good", donorName: "Test Donor",
      donorEmail: "donor@example.com", donorPhone: null,
    });
    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload).toMatchObject({ orderId: "order_good123", amount: 50_000, currency: "INR" });
    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["sub-paise funds", 100.001, 1000],
    ["sub-paise goal", 100, 1000.001],
    ["unpayable fractional remainder", 999.5, 1000],
    ["negative raised ledger", -1, 1000],
    ["invalid goal", 100, 0],
  ])("does not create a Razorpay order for %s", async (_case, amountRaised, goalAmount) => {
    mocks.safeParse.mockReturnValue({
      success: true,
      data: {
        appealId: "clx1234567890abcdef123456",
        donorName: "Test Donor", donorEmail: "donor@example.com",
        donorPhone: "", amount: 500, givingIntent: "GENERAL",
        isAnonymous: false, domesticConfirmed: true,
      },
    });
    mocks.findFirst.mockResolvedValue({
      id: "appeal_1", slug: "appeal-1", title: "Appeal 1",
      status: "PUBLISHED", amountRaised, goalAmount, closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "UNREVIEWED" } },
    });
    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toMatch(/private/i);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns private retryable 503 on interrupted request-body transport before any provider or database work", async () => {
    const request = new Request("https://amaana.example/api/donations/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: new ReadableStream<Uint8Array>({
        start(controller) { controller.error(new Error("synthetic connection interruption")); },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const response = await POST(request);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Donation request could not be read. Please try again.",
    });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.enforceDonationRateLimit).toHaveBeenCalledOnce();
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an oversized payload before appeal or Razorpay work", async () => {
    const request = new Request("https://amaana.example/api/donations/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(32 * 1024 + 1),
      },
      body: JSON.stringify({
        appealId: "clx1234567890abcdef123456",
        donorName: "Test Donor",
        donorEmail: "donor@example.com",
        amount: 500,
        domesticConfirmed: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ error: "Donation request payload is too large." });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});


describe("donation order provider-side uncertainty", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.safeParse.mockReturnValue({ success: true, data: {
      appealId: "clx1234567890abcdef123456",
      donorName: "Synthetic Donor", donorEmail: "synthetic@example.test",
      donorPhone: "", amount: 500, givingIntent: "GENERAL",
      isAnonymous: false, domesticConfirmed: true,
    } });
    mocks.findFirst.mockResolvedValue({
      id: "appeal_1", slug: "appeal-1", title: "Appeal 1",
      status: "PUBLISHED", amountRaised: 100, goalAmount: 1000, closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "UNREVIEWED" } },
    });
  });

  const submit = () => POST(new Request("https://amaana.example/api/donations/order", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  }));

  it("does not recommend another order when Razorpay rejects after a possibly committed provider write", async () => {
    mocks.createRazorpayOrder.mockRejectedValueOnce(new Error("synthetic provider response lost"));
    const response = await submit();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBeNull();
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow/i);
    expect(await response.json()).toEqual({ error: "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment." });
    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("gives safe reconciliation guidance when a committed provider order cannot be persisted or recovered", async () => {
    mocks.createRazorpayOrder.mockResolvedValue({
      id: "order_synthetic123", amount: 50_000, currency: "INR",
      receipt: "AMN-123", status: "created",
    });
    mocks.create.mockRejectedValueOnce(new Error("synthetic lost database write acknowledgement"));
    mocks.findUnique.mockResolvedValueOnce(null);
    const response = await submit();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBeNull();
    expect(await response.json()).toEqual({ error: "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment." });
    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });

  it("does not advertise retry when a provider returns unusable order identity", async () => {
    mocks.createRazorpayOrder.mockResolvedValue({
      id: "INVALID_ORDER", amount: 50_000, currency: "INR",
      receipt: "AMN-123", status: "created",
    });
    const response = await submit();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBeNull();
    expect((await response.json()).error).toMatch(/order may have been created/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("still accepts the fully verified provider order and persists exactly one claim", async () => {
    mocks.createRazorpayOrder.mockResolvedValue({
      id: "order_synthetic123", amount: 50_000, currency: "INR",
      receipt: "AMN-123", status: "created",
    });
    mocks.create.mockResolvedValue({
      id: "donation_synthetic", donorName: "Synthetic Donor", donorEmail: "synthetic@example.test", donorPhone: null,
    });
    const response = await submit();
    expect(response.status).toBe(201);
    expect((await response.json()).orderId).toBe("order_synthetic123");
    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
