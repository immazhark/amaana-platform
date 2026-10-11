import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  createRazorpayOrder: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findFirst: mocks.findFirst },
    donation: { create: mocks.create },
  },
}));
vi.mock("@/lib/razorpay", () => ({ createRazorpayOrder: mocks.createRazorpayOrder }));
vi.mock("@/lib/request-security", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/request-security")>(),
  enforceDonationRateLimit: async () => true,
}));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/public-environment", () => ({ canExposePublicAppeal: () => true }));

import { POST } from "./route";

const providerOrder = { id: "order_123", amount: 50000, currency: "INR", status: "created" };

function checkoutRequest() {
  return new Request("https://amaana.example/api/donations/order", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://amaana.example" },
    body: JSON.stringify({
      appealId: "clx1234567890abcdef123456",
      donorName: "Synthetic Donor",
      donorEmail: "donor@example.com",
      amount: 500,
      givingIntent: "GENERAL",
      domesticConfirmed: true,
    }),
  });
}

describe("provider order boundary before donation persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaana.example");
    vi.stubEnv("DONATION_TOKEN_PEPPER", "synthetic-token-pepper");
    mocks.findFirst.mockResolvedValue({
      id: "clx1234567890abcdef123456", slug: "synthetic-appeal", title: "Synthetic appeal",
      status: "PUBLISHED", goalAmount: 1000, amountRaised: 0, closesAt: null,
      assistanceRequest: null,
    });
    mocks.create.mockResolvedValue({
      id: "donation_123", donorName: "Synthetic Donor", donorEmail: "donor@example.com", donorPhone: null,
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { id: undefined }, { id: null }, { id: "" }, { id: " \t\n" },
    { id: 123 }, { id: false }, { id: {} }, { id: [] },
    { amount: 49900 }, { currency: "USD" },
  ])("rejects unusable provider identity or mismatched money before persistence: %j", async invalid => {
    mocks.createRazorpayOrder.mockResolvedValue({ ...providerOrder, ...invalid });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "We could not start the secure payment. Please try again." });
    expect(mocks.createRazorpayOrder).toHaveBeenCalledOnce();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  });

  it("persists and returns a matching provider order without changing its identity or amount", async () => {
    mocks.createRazorpayOrder.mockResolvedValue(providerOrder);

    const response = await POST(checkoutRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(expect.objectContaining({ donationId: "donation_123", orderId: "order_123", amount: 50000, currency: "INR" }));
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerOrderId: "order_123", amount: 500, paymentMethod: "RAZORPAY", provider: "RAZORPAY" }),
    }));
    expect(mocks.createRazorpayOrder).toHaveBeenCalledWith(expect.objectContaining({
      amountPaise: 50000, receipt: expect.any(String),
      appealId: "clx1234567890abcdef123456", givingIntent: "GENERAL",
    }));
    expect(body.receiptToken).toEqual(expect.any(String));
  });
});
