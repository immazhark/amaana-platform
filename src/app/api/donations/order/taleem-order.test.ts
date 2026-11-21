import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(), fundFindFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), createRazorpayOrder: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceDonationRateLimit: mocks.enforceDonationRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findFirst: mocks.fundFindFirst }, fundCampaign: { findFirst: vi.fn() }, appeal: { findFirst: vi.fn() }, donation: { create: mocks.create, findUnique: mocks.findUnique } } }));
vi.mock("@/lib/razorpay", () => ({ createRazorpayOrder: mocks.createRazorpayOrder }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

const taleem = { id: "fund_taleem", slug: "taleem", name: "Taleem Fund", zakatPolicy: "ACCEPTED", isGeneral: false };
const body = (over: Record<string, unknown> = {}) => ({
  fundSlug: "taleem", donorName: "Test Donor", donorEmail: "donor@example.com", amount: 3000, givingIntent: "SADAQAH", domesticConfirmed: true,
  sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 3, ...over,
});
const post = (payload: unknown) => POST(new Request("https://amaana.example/api/donations/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
const open = () => { vi.stubEnv("FUND_GIVING_ENABLED", "true"); vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true"); };

describe("Taleem programme sponsorship through the order route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    open();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(taleem);
    mocks.createRazorpayOrder.mockImplementation(async (input: { amountPaise: number; receipt: string }) => ({ id: "order_taleem123", amount: input.amountPaise, currency: "INR", receipt: input.receipt, status: "created" }));
    mocks.create.mockResolvedValue({ id: "donation_taleem", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: null });
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("charges the server's price and records programme, units, months, the per-unit rate and its version", async () => {
    const response = await post(body());
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ amount: 300_000 });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({
      fundId: "fund_taleem", amount: 3000,
      sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 3, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "approved-2026-11",
    });
    expect(mocks.create.mock.calls[0]?.[0].data).not.toHaveProperty("campaignId");
  });

  it("records the rate per unit for several units", async () => {
    const response = await post(body({ amount: 14_400, sponsorshipProgramme: "nazira", sponsorshipUnits: 2, sponsorshipMonths: 6 }));
    expect(response.status).toBe(201);
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ amount: 14_400, sponsorshipUnits: 2, sponsorshipMonths: 6, sponsorshipMonthlyRate: 1200 });
  });

  it("keeps the covered gateway fee out of the sponsorship amount", async () => {
    const response = await post(body({ coverProcessingFee: true }));
    expect(response.status).toBe(201);
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ amount: 3000, sponsorshipMonthlyRate: 1000, feeContributionAmount: expect.any(Number) });
  });

  it("accepts units and months submitted as digit strings", async () => {
    expect((await post(body({ sponsorshipUnits: "1", sponsorshipMonths: "3" }))).status).toBe(201);
  });

  it("is closed until its own switch is on, even when fund giving is open", async () => {
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "false");
    const response = await post(body());
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("Taleem sponsorship is not open yet.");
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("is closed when its switch is on but fund giving is closed", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    expect((await post(body())).status).toBe(409);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it.each([
    ["a tampered amount", { amount: 100 }],
    ["an amount for a different duration", { amount: 12_000 }],
  ])("rejects %s without contacting Razorpay", async (_name, over) => {
    const response = await post(body(over));
    expect(response.status).toBe(409);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown programme", { sponsorshipProgramme: "hifdh-boarding" }],
    ["a duration that is not offered", { sponsorshipMonths: 2 }],
    ["more than 50 units", { sponsorshipUnits: 51 }],
    ["a programme without units and months", { sponsorshipUnits: undefined, sponsorshipMonths: undefined }],
    ["units without a programme", { sponsorshipProgramme: undefined }],
    ["a sponsorship combined with a campaign", { campaignSlug: "eid", units: 1 }],
    ["a sponsorship combined with a custom request", { donorDirective: "for one child" }],
  ])("rejects %s with a 400", async (_name, over) => {
    const response = await post(body(over));
    expect(response.status).toBe(400);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("refuses a sponsorship sent to any other fund", async () => {
    mocks.fundFindFirst.mockResolvedValue({ id: "fund_dates", slug: "dates", name: "Dates Fund", zakatPolicy: "NOT_ACCEPTED", isGeneral: false });
    const response = await post(body({ fundSlug: "dates" }));
    expect(response.status).toBe(400);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("allows Zakat to the Taleem fund, which the owner ruled Zakat-accepting", async () => {
    expect((await post(body({ givingIntent: "ZAKAT" }))).status).toBe(201);
  });

  it("leaves an ordinary Taleem fund gift with no sponsorship columns", async () => {
    const response = await post({ ...body(), amount: 777, sponsorshipProgramme: undefined, sponsorshipUnits: undefined, sponsorshipMonths: undefined });
    expect(response.status).toBe(201);
    const data = mocks.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ amount: 777 });
    for (const key of ["sponsorshipProgramme", "sponsorshipUnits", "sponsorshipMonths", "sponsorshipMonthlyRate", "sponsorshipRateVersion"]) expect(data).not.toHaveProperty(key);
  });
});
