import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(), fundFindFirst: vi.fn(), campaignFindFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), createRazorpayOrder: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceDonationRateLimit: mocks.enforceDonationRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findFirst: mocks.fundFindFirst }, fundCampaign: { findFirst: mocks.campaignFindFirst }, appeal: { findFirst: vi.fn() }, donation: { create: mocks.create, findUnique: mocks.findUnique } } }));
vi.mock("@/lib/razorpay", () => ({ createRazorpayOrder: mocks.createRazorpayOrder }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

beforeAll(() => { vi.stubEnv("FUND_GIVING_ENABLED", "true"); vi.useFakeTimers({ toFake: ["Date"], now: new Date("2027-02-20T06:00:00Z") }); });
afterAll(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

const eid = { id: "fund_eid_kits", slug: "eid-kits", name: "Eid Kits Fund", zakatPolicy: "NOT_ACCEPTED", isGeneral: false };
const open = (over: Record<string, unknown> = {}) => ({ id: "camp_1", unitPrice: { toNumber: () => 1500 }, maxUnits: 100, status: "ACTIVE", opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), ...over });
const body = (over: Record<string, unknown> = {}) => ({ fundSlug: "eid-kits", donorName: "Test Donor", donorEmail: "donor@example.com", amount: 4500, givingIntent: "SADAQAH", domesticConfirmed: true, campaignSlug: "eid-kits-2027", units: 3, ...over });
const post = (payload: unknown) => POST(new Request("https://amaana.example/api/donations/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));

describe("campaign gifts through the order route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(eid);
    mocks.campaignFindFirst.mockResolvedValue(open());
    mocks.createRazorpayOrder.mockImplementation(async (input: { amountPaise: number; receipt: string }) => ({ id: "order_camp123", amount: input.amountPaise, currency: "INR", receipt: input.receipt, status: "created" }));
    mocks.create.mockResolvedValue({ id: "donation_camp", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: null });
  });

  it("charges units x price and records the campaign, units and the price snapshot", async () => {
    const response = await post(body());
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ amount: 450_000 });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ fundId: "fund_eid_kits", amount: 4500, campaignId: "camp_1", units: 3, unitPrice: 1500 });
  });
  it("keeps the fee cover out of the campaign amount, so amount stays exactly units x price", async () => {
    const response = await post(body({ coverProcessingFee: true }));
    expect(response.status).toBe(201);
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ amount: 4500, units: 3, unitPrice: 1500, feeContributionAmount: expect.any(Number) });
  });
  it("accepts units submitted as a digit string", async () => {
    expect((await post(body({ units: "3" }))).status).toBe(201);
  });
  it("rejects a tampered amount without contacting Razorpay", async () => {
    const response = await post(body({ amount: 100 }));
    expect(response.status).toBe(409);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([
    ["unknown or other-fund campaign", () => mocks.campaignFindFirst.mockResolvedValue(null)],
    ["closed campaign", () => mocks.campaignFindFirst.mockResolvedValue(open({ status: "CLOSED" }))],
    ["campaign not yet open", () => mocks.campaignFindFirst.mockResolvedValue(open({ opensAt: new Date("2027-03-01T00:00:00Z"), closesAt: new Date("2027-03-05T00:00:00Z") }))],
    ["campaign whose window ended", () => mocks.campaignFindFirst.mockResolvedValue(open({ closesAt: new Date("2027-02-19T00:00:00Z"), opensAt: new Date("2027-02-10T00:00:00Z") }))],
  ])("refuses a gift to an %s", async (_name, arrange) => {
    arrange();
    const response = await post(body());
    expect(response.status).toBe(409);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });
  it.each([
    ["a campaign without units", { units: undefined }],
    ["units without a campaign", { campaignSlug: undefined }],
    ["zero units", { units: 0, amount: 0 }],
    ["fractional units", { units: 1.5 }],
    ["more units than the limit", { units: 101, amount: 151_500 }],
    ["an invalid campaign slug", { campaignSlug: "Eid Kits!" }],
  ])("rejects %s", async (_name, over) => {
    const response = await post(body(over));
    expect(response.status).toBe(400);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });
  it("still refuses Zakat on a non-Zakat fund's campaign", async () => {
    const response = await post(body({ givingIntent: "ZAKAT" }));
    expect(response.status).toBe(409);
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });
});
