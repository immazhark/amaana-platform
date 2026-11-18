import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  fundFindFirst: vi.fn(),
  appealFindFirst: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  createRazorpayOrder: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceDonationRateLimit: mocks.enforceDonationRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    fund: { findFirst: mocks.fundFindFirst },
    appeal: { findFirst: mocks.appealFindFirst },
    donation: { create: mocks.create, findUnique: mocks.findUnique },
  },
}));
vi.mock("@/lib/razorpay", () => ({ createRazorpayOrder: mocks.createRazorpayOrder }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

beforeAll(() => { vi.stubEnv("FUND_GIVING_ENABLED", "true"); });
afterAll(() => { vi.unstubAllEnvs(); });

const general = { id: "fund_general", slug: "general", name: "General Fund", zakatPolicy: "ACCEPTED", isGeneral: true };
const eid = { id: "fund_eid_kits", slug: "eid-kits", name: "Eid Kits Fund", zakatPolicy: "NOT_ACCEPTED", isGeneral: false };
const orphan = { id: "fund_orphan", slug: "orphan", name: "Orphan Fund", zakatPolicy: "ACCEPTED", isGeneral: false };

const body = (overrides: Record<string, unknown> = {}) => ({
  fundSlug: "general", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: "",
  amount: 5000, givingIntent: "SADAQAH", isAnonymous: false, domesticConfirmed: true, ...overrides,
});
const post = (payload: unknown) => POST(new Request("https://amaana.example/api/donations/order", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
}));

describe("fund donation orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(general);
    mocks.createRazorpayOrder.mockImplementation(async (input: { amountPaise: number; receipt: string }) => ({ id: "order_fund123", amount: input.amountPaise, currency: "INR", receipt: input.receipt, status: "created" }));
    mocks.create.mockResolvedValue({ id: "donation_fund", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: null });
  });

  it("is closed unless the owner has switched fund giving on", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    try {
      const response = await post(body());
      expect(response.status).toBe(409);
      expect(mocks.fundFindFirst).not.toHaveBeenCalled();
      expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    } finally { vi.stubEnv("FUND_GIVING_ENABLED", "true"); }
  });

  it("creates an order for an active fund and stores the fund, not an appeal", async () => {
    const response = await post(body({ givingIntent: "ZAKAT" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ orderId: "order_fund123", amount: 500_000, appealTitle: "General Fund" });
    expect(mocks.appealFindFirst).not.toHaveBeenCalled();
    const data = mocks.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ fundId: "fund_general", givingIntent: "ZAKAT", amount: 5000, feeContributionAmount: 0, donorDirective: null });
    expect(data).not.toHaveProperty("appealId");
    expect(mocks.createRazorpayOrder).toHaveBeenCalledWith(expect.objectContaining({ fundSlug: "general", amountPaise: 500_000 }));
    expect(mocks.createRazorpayOrder.mock.calls[0]?.[0]).not.toHaveProperty("appealId");
  });

  it("refuses Zakat on a fund that does not accept it and never contacts Razorpay", async () => {
    mocks.fundFindFirst.mockResolvedValue(eid);
    const response = await post(body({ fundSlug: "eid-kits", givingIntent: "ZAKAT" }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Zakat is not accepted for this fund/);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("still accepts Sadaqah for a fund that refuses Zakat", async () => {
    mocks.fundFindFirst.mockResolvedValue(eid);
    expect((await post(body({ fundSlug: "eid-kits", givingIntent: "SADAQAH" }))).status).toBe(201);
  });

  it("rejects an unknown or inactive fund (only ACTIVE funds are queried)", async () => {
    mocks.fundFindFirst.mockResolvedValue(null);
    const response = await post(body({ fundSlug: "missing" }));
    expect(response.status).toBe(409);
    expect(mocks.fundFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "missing", status: "ACTIVE" } }));
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("keeps a custom request only on the General Fund", async () => {
    expect((await post(body({ donorDirective: "  Please use for orphan winter clothing  " }))).status).toBe(201);
    expect(mocks.create.mock.calls[0]?.[0].data.donorDirective).toBe("Please use for orphan winter clothing");
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(orphan);
    const rejected = await post(body({ fundSlug: "orphan", donorDirective: "somewhere else" }));
    expect(rejected.status).toBe(400);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("charges the donation plus a server-calculated fee and stores it separately", async () => {
    const response = await post(body({ coverProcessingFee: true }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ amount: 512_086 });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ amount: 5000, feeContributionAmount: 120.86 });
  });

  it.each([
    ["an appeal and a fund together", { appealId: "cmf1234567890123456789012" }],
    ["a client-supplied fee amount", { feeContributionAmount: 0 }],
    ["an invalid slug", { fundSlug: "General Fund!" }],
    ["a too-long slug", { fundSlug: "a".repeat(65) }],
    ["a non-boolean fee flag", { coverProcessingFee: "true" }],
    ["a fractional amount", { amount: 10.5 }],
    ["an over-long request", { donorDirective: "x".repeat(501) }],
    ["missing domestic confirmation", { domesticConfirmed: false }],
    ["an unknown intent", { givingIntent: "RIBA" }],
  ])("rejects %s before any fund lookup", async (_name, override) => {
    const response = await post(body(override));
    expect(response.status).toBe(400);
    expect(mocks.fundFindFirst).not.toHaveBeenCalled();
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("enforces the minimum donation", async () => {
    const response = await post(body({ amount: 9 }));
    expect(response.status).toBe(400);
    expect(mocks.fundFindFirst).not.toHaveBeenCalled();
  });

  it("gives safe guidance when the provider outcome is uncertain", async () => {
    mocks.createRazorpayOrder.mockRejectedValueOnce(new Error("timeout"));
    const response = await post(body());
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/uncertain/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps appeal orders on the appeal path when no fund is named", async () => {
    mocks.appealFindFirst.mockResolvedValue(null);
    const response = await post({ appealId: "cmf1234567890123456789012", donorName: "Test Donor", donorEmail: "donor@example.com", amount: 500, givingIntent: "GENERAL", domesticConfirmed: true });
    expect(response.status).toBe(409);
    expect(mocks.appealFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.fundFindFirst).not.toHaveBeenCalled();
  });
});
