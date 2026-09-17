import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  createRazorpayOrder: vi.fn(),
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

import { POST } from "./route";

describe("donation order request bounds", () => {
  it("rejects an oversized payload before appeal or Razorpay work", async () => {
    mocks.enforceDonationRateLimit.mockResolvedValue(true);

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
