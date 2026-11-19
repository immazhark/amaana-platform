import { describe, expect, it, vi } from "vitest";
import { resolveFundDestination } from "./fund-destination";

const now = new Date("2027-02-20T06:00:00Z");
const fund = { id: "fund_eid_kits", slug: "eid-kits", name: "Eid Kits Fund", zakatPolicy: "NOT_ACCEPTED" as const, isGeneral: false };
const campaign = (over: Record<string, unknown> = {}) => ({ id: "camp_1", unitPrice: { toNumber: () => 1500 }, maxUnits: 100, status: "ACTIVE" as const, opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), ...over });
const client = (row: unknown) => ({ fund: { findFirst: vi.fn().mockResolvedValue(fund) }, fundCampaign: { findFirst: vi.fn().mockResolvedValue(row) } }) as never;
const ask = (c: never, over: Record<string, unknown> = {}) => resolveFundDestination(c, { fundSlug: "eid-kits", givingIntent: "SADAQAH", campaignSlug: "eid-kits-2027", units: 3, amount: 4500, now, ...over });

describe("campaign gifts", () => {
  it("accepts an open campaign at exactly units x price and returns the snapshot to store", async () => {
    await expect(ask(client(campaign()))).resolves.toEqual({ ok: true, value: { fundId: "fund_eid_kits", fundSlug: "eid-kits", title: "Eid Kits Fund", donorDirective: null, campaignId: "camp_1", units: 3, unitPrice: 1500 } });
  });
  it("looks the campaign up by slug within the chosen fund only", async () => {
    const c = client(campaign());
    await ask(c);
    expect((c as { fundCampaign: { findFirst: ReturnType<typeof vi.fn> } }).fundCampaign.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "eid-kits-2027", fundId: "fund_eid_kits" } }));
  });
  it("refuses a campaign that does not belong to this fund (not found within it)", async () => {
    await expect(ask(client(null))).resolves.toMatchObject({ ok: false, status: 409 });
  });
  it.each([
    ["not yet open", { opensAt: new Date("2027-02-21T00:00:00Z") }],
    ["already closed", { closesAt: new Date("2027-02-20T06:00:00Z") }],
    ["still a draft", { status: "DRAFT" }],
    ["closed by an admin", { status: "CLOSED" }],
  ])("refuses a campaign that is %s", async (_name, over) => {
    await expect(ask(client(campaign(over)))).resolves.toMatchObject({ ok: false, status: 409, error: "This campaign is not open for gifts." });
  });
  it("treats a client amount that is not units x price as a changed price", async () => {
    for (const amount of [4000, 4501, 1500, undefined]) await expect(ask(client(campaign()), { amount })).resolves.toMatchObject({ ok: false, status: 409, error: expect.stringMatching(/price .* changed/) });
  });
  it("enforces the per-gift unit limit and whole-number units", async () => {
    await expect(ask(client(campaign({ maxUnits: 5 })), { units: 6, amount: 9000 })).resolves.toMatchObject({ ok: false, status: 400, error: expect.stringMatching(/at most 5/) });
    for (const units of [0, -2, 1.5, Number.NaN]) await expect(ask(client(campaign()), { units, amount: 0 })).resolves.toMatchObject({ ok: false, status: 400 });
  });
  it("needs the campaign and the units together", async () => {
    await expect(ask(client(campaign()), { units: undefined })).resolves.toMatchObject({ ok: false, status: 400 });
    await expect(ask(client(campaign()), { campaignSlug: undefined })).resolves.toMatchObject({ ok: false, status: 400 });
  });
  it("still applies the fund's Zakat rule to a campaign gift", async () => {
    await expect(ask(client(campaign()), { givingIntent: "ZAKAT" })).resolves.toMatchObject({ ok: false, status: 409, error: expect.stringMatching(/Zakat is not accepted/) });
  });
  it("is unchanged for an ordinary fund gift with no campaign", async () => {
    const c = client(null);
    await expect(resolveFundDestination(c, { fundSlug: "eid-kits", givingIntent: "SADAQAH" })).resolves.toMatchObject({ ok: true, value: { donorDirective: null } });
    expect((c as { fundCampaign: { findFirst: ReturnType<typeof vi.fn> } }).fundCampaign.findFirst).not.toHaveBeenCalled();
  });
});
