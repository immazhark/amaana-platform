import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  createRazorpayOrder: vi.fn(),
  safeParse: vi.fn(),
}));

vi.mock("@/lib/appeals", () => ({
  getRemainingAppealAmount: () => 0,
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
