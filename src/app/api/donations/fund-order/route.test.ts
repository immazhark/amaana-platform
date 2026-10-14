import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  findFund: vi.fn(),
  createDonation: vi.fn(),
  findDonation: vi.fn(),
  order: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: async (request: Request, max: number) => {
      const declared = Number(request.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > max) throw new RequestBodyTooLargeError();
      return request.text();
    },
  };
});
vi.mock("@/lib/donations", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/donations")>(),
  createDonationReference: () => "AFD-FUND-SYNTHETIC",
  createReceiptToken: () => "private-synthetic-receipt-token",
  hashReceiptToken: () => "synthetic-hash",
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceDonationRateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/server-log", () => ({ logServerError: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    givingFund: { findUnique: mocks.findFund },
    donation: { create: mocks.createDonation, findUnique: mocks.findDonation },
  },
}));
vi.mock("@/lib/razorpay", () => ({ createRazorpayOrder: mocks.order }));

import { POST } from "./route";

const validFund = {
  id: "cmf1234567890123456789012",
  slug: "synthetic-approved-fund",
  name: "Synthetic approved charitable fund",
  purpose: "A reviewed restricted purpose for the synthetic giving programme.",
  disclosure: "Support will be used only for independently reviewed charitable activity.",
  accountCode: "TEST-FUND",
  acceptedIntents: ["GENERAL", "SADAQAH"],
  currency: "INR",
  status: "APPROVED",
  revision: 4,
  createdById: "creator",
  lastEditedById: "editor",
  approvedById: "independent-approver",
  approvedAt: new Date("2026-10-14T10:00:00Z"),
};
const fields = {
  fundId: validFund.id,
  fundRevision: 4,
  donorName: "Synthetic donor",
  donorEmail: "donor@example.com",
  donorPhone: "",
  amount: 500,
  givingIntent: "GENERAL",
  isAnonymous: false,
  domesticConfirmed: true,
};

function request(body: unknown = fields, headers?: Record<string, string>) {
  return new Request("https://amaana.example/api/donations/fund-order", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("reviewed giving-fund order: inactive by default", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "true");
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", validFund.id);
    mocks.rateLimit.mockResolvedValue(true);
    mocks.findFund.mockResolvedValue(validFund);
    mocks.order.mockResolvedValue({
      id: "order_synthetic", amount: 50000, currency: "INR",
      receipt: "AFD-FUND-SYNTHETIC", status: "created",
    });
    mocks.createDonation.mockImplementation(async ({ data }) => ({
      id: data.id, donorName: data.donorName, donorEmail: data.donorEmail, donorPhone: data.donorPhone,
    }));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("does not parse, query or contact a gateway without the server-only release flag", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "false");
    const response = await POST(request(fields));
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.findFund).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.createDonation).not.toHaveBeenCalled();
  });

  it("keeps approved fund orders unavailable when the per-fund release list is unset", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", "");
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(mocks.findFund).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("requires this exact fund ID to be explicitly listed", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", "another-reviewed-fund");
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(mocks.findFund).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it.each([
    { ...fields, appealId: "cmf1234567890123456789014" },
    { ...fields, fundId: undefined },
    { ...fields, fundRevision: "4" },
    { ...fields, fundRevision: 5.1 },
    { ...fields, fundRevision: -1 },
    { ...fields, designationSnapshot: { label: "Overridden" } },
    { ...fields, givingIntent: "SADAQAH_JARIYAH" },
    { ...fields, amount: 0 },
    { ...fields, amount: 9 },
    { ...fields, amount: 12.5 },
    { ...fields, domesticConfirmed: false },
  ])("rejects invalid or mixed destination input before fund lookup: %#", async body => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(mocks.findFund).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it.each([
    { status: "PAUSED" },
    { status: "DRAFT", approvedById: null, approvedAt: null },
    { currency: "USD" },
    { approvedById: "creator" },
  ])("does not create payment order for unsafe fund state %#", async patch => {
    mocks.findFund.mockResolvedValue({ ...validFund, ...patch });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.createDonation).not.toHaveBeenCalled();
  });

  it("rejects stale revisions and fund Zakat before payment order creation", async () => {
    expect((await POST(request({ ...fields, fundRevision: 3 }))).status).toBe(409);
    expect((await POST(request({ ...fields, givingIntent: "ZAKAT" }))).status).toBe(409);
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.createDonation).not.toHaveBeenCalled();
  });

  it("does not create an order for an unknown, non-public fund", async () => {
    mocks.findFund.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("creates a private order with the exact reviewed purpose and no appeal", async () => {
    const response = await POST(request({ ...fields, donorEmail: "Donor@Example.com" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      orderId: "order_synthetic", amount: 50000, currency: "INR",
      fundName: validFund.name,
      donor: { email: "donor@example.com" },
    });
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/);
    expect(mocks.order).toHaveBeenCalledExactlyOnceWith({
      amountPaise: 50000, receipt: "AFD-FUND-SYNTHETIC",
      fundId: validFund.id, givingIntent: "GENERAL",
    });
    expect(mocks.createDonation).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        appealId: null, fundId: validFund.id, givingIntent: "GENERAL",
        designationSnapshot: {
          version: 1, kind: "FUND",
          fundId: validFund.id, fundRevision: 4,
          label: validFund.name, purpose: validFund.purpose,
          disclosure: validFund.disclosure, accountCode: validFund.accountCode,
          givingIntent: "GENERAL",
        },
      }),
    }));
  });

  it("rejects an unusable provider order before creating a local payment", async () => {
    mocks.order.mockResolvedValue({ id: "order_synthetic", amount: 10000, currency: "INR", receipt: "AFD-FUND-SYNTHETIC", status: "created" });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(mocks.createDonation).not.toHaveBeenCalled();
  });

  it("fails closed when a fund is paused between provider order and SQL donation insert", async () => {
    mocks.createDonation.mockRejectedValue(new Error("SQL approved fund guard failed"));
    mocks.findDonation.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(mocks.findDonation).toHaveBeenCalledOnce();
    expect((await response.json())).not.toHaveProperty("orderId");
  });

  it("recovers only the record created by the same request after a lost database acknowledgement", async () => {
    mocks.createDonation.mockRejectedValue(new Error("Uncertain commit"));
    mocks.findDonation.mockImplementation(async ({ where }) => ({
      id: where.id, donorName: fields.donorName, donorEmail: fields.donorEmail,
      donorPhone: null, providerOrderId: "order_synthetic", receiptTokenHash: "synthetic-hash",
    }));
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.findDonation).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: expect.any(String) },
    }));
  });

  it("preserves evidence of a failed first attempt without returning an unrelated donor receipt", async () => {
    mocks.createDonation.mockRejectedValue(new Error("Uncertain commit"));
    mocks.findDonation.mockResolvedValue({
      id: "other-donor", providerOrderId: "order_unrelated", receiptTokenHash: "synthetic-hash",
    });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json())).not.toHaveProperty("receiptToken");
  });
});
