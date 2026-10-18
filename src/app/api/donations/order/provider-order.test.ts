import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  createRazorpayOrder: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findFirst: mocks.findFirst },
    donation: { create: mocks.create, findUnique: mocks.findUnique },
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
import { hashReceiptToken } from "@/lib/donations";

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
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({
      id: "donation_123", donorName: "Synthetic Donor", donorEmail: "donor@example.com", donorPhone: null,
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { id: undefined }, { id: null }, { id: "" }, { id: " \t\n" },
    { id: 123 }, { id: false }, { id: {} }, { id: [] },
    { id: "not-an-order" }, { id: "order_" }, { id: "order_123 extra" },
    { amount: 49900 }, { currency: "USD" }, { status: "paid" }, { status: "attempted" }, { status: null },
    { receipt: "AFD-FOREIGN" }, { receipt: "" }, { receipt: null },
  ])("rejects unusable provider identity or mismatched money before persistence: %j", async invalid => {
    mocks.createRazorpayOrder.mockImplementation(async ({ receipt }: { receipt: string }) => ({ ...providerOrder, receipt, ...invalid }));

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment." });
    expect(response.headers.get("retry-after")).toBeNull();
    expect(mocks.createRazorpayOrder).toHaveBeenCalledOnce();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  });

  it("persists and returns a matching provider order without changing its identity or amount", async () => {
    mocks.createRazorpayOrder.mockImplementation(async ({ receipt }: { receipt: string }) => ({ ...providerOrder, receipt }));

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
  it("recovers a committed checkout using the same provider order and receipt credentials", async () => {
    mocks.createRazorpayOrder.mockImplementation(async ({ receipt }: { receipt: string }) => ({ ...providerOrder, receipt }));
    mocks.create.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    mocks.findUnique.mockImplementationOnce(async ({ where }) => {
      const call = mocks.create.mock.calls[0];
      if (!call) throw new Error("Expected donation persistence");
      return { id: where.id, donorName: "Synthetic Donor", donorEmail: "donor@example.com", donorPhone: null, providerOrderId: "order_123", receiptTokenHash: call[0].data.receiptTokenHash };
    });

    const response = await POST(checkoutRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.orderId).toBe("order_123");
    const call = mocks.create.mock.calls[0];
    if (!call) throw new Error("Expected donation persistence");
    expect(body.donationId).toBe(call[0].data.id);
    expect(hashReceiptToken(body.receiptToken)).toBe(call[0].data.receiptTokenHash);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { id: body.donationId }, select: { id: true, donorName: true, donorEmail: true, donorPhone: true, providerOrderId: true, receiptTokenHash: true } });
    expect(mocks.createRazorpayOrder).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it.each(["absent", "unavailable", "foreign-order", "foreign-token"])("does not start checkout with a %s recovery outcome", async outcome => {
    mocks.createRazorpayOrder.mockImplementation(async ({ receipt }: { receipt: string }) => ({ ...providerOrder, receipt }));
    mocks.create.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    if (outcome === "unavailable") mocks.findUnique.mockRejectedValueOnce(new Error("database unavailable"));
    if (outcome.startsWith("foreign")) mocks.findUnique.mockImplementationOnce(async () => {
      const call = mocks.create.mock.calls[0];
      if (!call) throw new Error("Expected donation persistence");
      return { id: call[0].data.id, donorName: "Private Donor", donorEmail: "private@example.test", donorPhone: null, providerOrderId: outcome === "foreign-order" ? "order_other" : "order_123", receiptTokenHash: outcome === "foreign-token" ? "other-token" : call[0].data.receiptTokenHash };
    });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment." });
    expect(response.headers.get("retry-after")).toBeNull();
    expect(mocks.createRazorpayOrder).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.findUnique).toHaveBeenCalledOnce();
  });

});
