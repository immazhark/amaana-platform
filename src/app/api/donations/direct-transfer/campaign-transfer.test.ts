import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(), fundFindFirst: vi.fn(), campaignFindFirst: vi.fn(), appealFindFirst: vi.fn(), donationCreate: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceDonationRateLimit: mocks.enforceDonationRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findFirst: mocks.fundFindFirst }, fundCampaign: { findFirst: mocks.campaignFindFirst }, appeal: { findFirst: mocks.appealFindFirst }, donation: { create: mocks.donationCreate, findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() } } }));
vi.mock("@/lib/storage", () => ({ MAX_FILE_BYTES: 5 * 1024 * 1024, uploadDonationEvidence: vi.fn(), deleteDonationEvidenceObject: vi.fn() }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

beforeAll(() => { vi.stubEnv("FUND_GIVING_ENABLED", "true"); vi.useFakeTimers({ toFake: ["Date"], now: new Date("2027-02-20T06:00:00Z") }); });
afterAll(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

const eid = { id: "fund_eid_kits", slug: "eid-kits", name: "Eid Kits Fund", zakatPolicy: "NOT_ACCEPTED", isGeneral: false };
const open = (over: Record<string, unknown> = {}) => ({ id: "camp_1", unitPrice: { toNumber: () => 1500 }, maxUnits: 100, status: "ACTIVE", opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), ...over });

function request(fields: Record<string, string> = {}, omit: string[] = []) {
  const base: Record<string, string> = {
    fundSlug: "eid-kits", donorName: "Test Donor", donorEmail: "donor@example.com", amount: "4500", givingIntent: "SADAQAH",
    paymentMethod: "BANK_TRANSFER", transferReference: "UTR123456789", transferredAt: "2027-02-19T05:00:00.000Z", domesticConfirmed: "true",
    campaignSlug: "eid-kits-2027", units: "3", ...fields,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(base)) if (!omit.includes(key)) form.append(key, value);
  return new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form });
}

describe("campaign gifts through the bank/UPI route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(eid);
    mocks.campaignFindFirst.mockResolvedValue(open());
    mocks.donationCreate.mockResolvedValue({ id: "donation-camp", referenceNumber: "AFD-2027-12345678" });
  });

  it("records a pending claim with the campaign, units and price snapshot", async () => {
    const response = await POST(request());
    expect(response.status).toBe(202);
    expect(mocks.donationCreate.mock.calls[0]?.[0].data).toMatchObject({ fundId: "fund_eid_kits", amount: 4500, campaignId: "camp_1", units: 3, unitPrice: 1500, status: "PENDING_VERIFICATION" });
  });
  it("rejects an amount that is not units x price before recording anything", async () => {
    const response = await POST(request({ amount: "4000" }));
    expect(response.status).toBe(409);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
  it.each([
    ["a closed campaign", () => mocks.campaignFindFirst.mockResolvedValue(open({ status: "CLOSED" }))],
    ["a campaign outside its window", () => mocks.campaignFindFirst.mockResolvedValue(open({ closesAt: new Date("2027-02-19T00:00:00Z"), opensAt: new Date("2027-02-10T00:00:00Z") }))],
    ["an unknown campaign", () => mocks.campaignFindFirst.mockResolvedValue(null)],
  ])("refuses %s", async (_name, arrange) => {
    arrange();
    expect((await POST(request())).status).toBe(409);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
  it.each([
    ["a campaign without units", {}, ["units"]],
    ["units without a campaign", {}, ["campaignSlug"]],
    ["fractional units", { units: "1.5" }, []],
    ["too many units", { units: "101", amount: "151500" }, []],
  ])("rejects %s", async (_name, fields, omit) => {
    expect((await POST(request(fields, omit))).status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
  it("refuses duplicated campaign fields", async () => {
    const form = new FormData();
    for (const [k, v] of Object.entries({ fundSlug: "eid-kits", donorName: "Test Donor", donorEmail: "donor@example.com", amount: "4500", givingIntent: "SADAQAH", paymentMethod: "BANK_TRANSFER", transferReference: "UTR123456789", transferredAt: "2027-02-19T05:00:00.000Z", domesticConfirmed: "true" })) form.append(k, v);
    form.append("units", "3"); form.append("units", "30"); form.append("campaignSlug", "eid-kits-2027");
    expect((await POST(new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form }))).status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
  it("rejects a campaign on an appeal gift", async () => {
    const response = await POST(request({ appealId: "cmf1234567890123456789012" }, ["fundSlug"]));
    expect(response.status).toBe(400);
    expect(mocks.appealFindFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
});
