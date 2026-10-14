import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  createRazorpayOrder: vi.fn(),
  safeParse: vi.fn(),
}));

vi.mock("@/lib/appeals", () => ({
  getRemainingAppealAmount: () => 900,
  isAppealOpenForDonations: () => true,
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

vi.mock("@/lib/donations", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/donations")>(),
  createDonationReference: () => "AMN-123",
  createReceiptToken: () => "receipt-token",
  donationSchema: { safeParse: mocks.safeParse },
  hashReceiptToken: () => "hashed-token",
  isDonationAmountAllowedForRemaining: (amount: number, remaining: number) => amount >= 10 && amount <= remaining,
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

  it.each(["cmf1234567890123456789013", "", null, { id: "private-fund" }])("rejects mixed destination %j with the real schema before lookup or provider order", async fundId => {
    const actual = await vi.importActual<typeof import("@/lib/donations")>("@/lib/donations");
    mocks.safeParse.mockImplementation(actual.donationSchema.safeParse.bind(actual.donationSchema));
    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appealId: "cmf1234567890123456789012", fundId, donorName: "Synthetic donor", donorEmail: "synthetic@example.invalid", amount: 500, givingIntent: "GENERAL", domesticConfirmed: true }),
    }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.findFirst).not.toHaveBeenCalled();
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
  it.each(["UNREVIEWED", "NOT_ELIGIBLE", "NOT_APPLICABLE", null])("rejects Zakat intent when review status is %s", async zakatStatus => {
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
      assistanceRequest: { verification: zakatStatus === null ? null : { zakatStatus } },
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


  it("allows explicitly eligible Zakat while retaining provider identity and donor-record checks", async () => {
    mocks.safeParse.mockReturnValue({
      success: true,
      data: {
        appealId: "clx1234567890abcdef123456",
        donorName: "Test Donor",
        donorEmail: "Donor@Example.com",
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
      assistanceRequest: { verification: { zakatStatus: "ELIGIBLE" } },
    });
    mocks.createRazorpayOrder.mockResolvedValue({
      id: "order_Valid123",
      amount: 50_000,
      currency: "INR",
      receipt: "AMN-123",
      status: "created",
    });
    mocks.create.mockImplementation(async ({ data }: { data: {
      id: string; donorName: string; donorEmail: string; donorPhone: string | null;
    } }) => ({
      id: data.id,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
    }));

    const response = await POST(new Request("https://amaana.example/api/donations/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.orderId).toBe("order_Valid123");
    expect(payload.amount).toBe(50_000);
    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);
    expect(mocks.createRazorpayOrder).toHaveBeenCalledWith({
      amountPaise: 50_000,
      receipt: "AMN-123",
      appealId: "appeal_1",
      givingIntent: "ZAKAT",
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        givingIntent: "ZAKAT",
        designationSnapshot: { version: 1, kind: "APPEAL", appealId: "appeal_1", label: "Appeal 1", givingIntent: "ZAKAT" },
        donorEmail: "donor@example.com",
        providerOrderId: "order_Valid123",
        paymentMethod: "RAZORPAY",
      }),
    }));
  });

});
