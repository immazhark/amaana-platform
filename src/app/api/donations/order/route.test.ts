import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  createRazorpayOrder: vi.fn(),
  safeParse: vi.fn(),
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
    donation: { create: mocks.create },
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
