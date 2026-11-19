import { describe, expect, it } from "vitest";
import { campaignIsOpen, checkCampaignGift, dateToIstLocal, istLocalToDate, parseCampaignFields, parseCreateCampaign, statusTransitionAllowed } from "./fund-campaign";

const opens = new Date("2027-02-18T03:30:00Z");
const closes = new Date("2027-02-23T18:29:00Z");
const open = { status: "ACTIVE" as const, opensAt: opens, closesAt: closes };

describe("campaignIsOpen", () => {
  it("is open only while ACTIVE and inside the half-open window", () => {
    expect(campaignIsOpen(open, new Date("2027-02-18T03:30:00Z"))).toBe(true);
    expect(campaignIsOpen(open, new Date("2027-02-18T03:29:59Z"))).toBe(false);
    expect(campaignIsOpen(open, new Date("2027-02-23T18:28:59Z"))).toBe(true);
    expect(campaignIsOpen(open, closes)).toBe(false);
  });
  it.each(["DRAFT", "CLOSED"] as const)("is never open while %s", status => {
    expect(campaignIsOpen({ ...open, status }, new Date("2027-02-20T00:00:00Z"))).toBe(false);
  });
});

describe("checkCampaignGift", () => {
  const campaign = { unitPrice: 1500, maxUnits: 100 };
  it("accepts exactly units times the unit price", () => {
    expect(checkCampaignGift(campaign, 3, 4500)).toEqual({ ok: true, units: 3, total: 4500 });
  });
  it.each([0, -1, 1.5, Number.NaN, Infinity, "3", null, undefined, Number.MAX_SAFE_INTEGER + 1])("rejects units %j", units => {
    expect(checkCampaignGift(campaign, units, 4500)).toEqual({ ok: false, code: "INVALID_UNITS" });
  });
  it("rejects more units than the per-gift limit", () => {
    expect(checkCampaignGift(campaign, 101, 151_500)).toEqual({ ok: false, code: "OVER_LIMIT" });
    expect(checkCampaignGift(campaign, 100, 150_000).ok).toBe(true);
  });
  it.each([4499, 4501, 0, "4500", null, undefined, 4500.5])("rejects a client amount of %j that is not units x price", amount => {
    expect(checkCampaignGift(campaign, 3, amount)).toEqual({ ok: false, code: "PRICE_MISMATCH" });
  });
  it("cannot overflow into a safe-looking total", () => {
    expect(checkCampaignGift({ unitPrice: Number.MAX_SAFE_INTEGER, maxUnits: 1000 }, 1000, 5)).toMatchObject({ ok: false });
  });
});

describe("IST local times", () => {
  it("converts to and from UTC exactly", () => {
    expect(istLocalToDate("2027-02-18T09:00")?.toISOString()).toBe("2027-02-18T03:30:00.000Z");
    expect(dateToIstLocal(new Date("2027-02-18T03:30:00Z"))).toBe("2027-02-18T09:00");
    expect(dateToIstLocal(istLocalToDate("2027-12-31T23:59")!)).toBe("2027-12-31T23:59");
  });
  it.each(["", "2027-02-30T09:00", "2027-13-01T09:00", "2027-02-18T24:00", "2027-02-18T09:60", "2027-02-18 09:00", "2027-02-18T09:00:00", "18/02/2027 09:00", "2027-2-18T9:00"])("rejects %j", value => {
    expect(istLocalToDate(value)).toBeNull();
  });
});

const base = { title: "Eid Kits 2027", unitLabel: "kit", unitLabelPlural: "kits", unitPrice: "1500", maxUnits: "100", opensAt: "2027-02-18T09:00", closesAt: "2027-02-24T23:59", status: "DRAFT", note: "Packed and distributed before Eid." };

describe("parseCampaignFields", () => {
  it("accepts a valid campaign and converts the window from IST", () => {
    expect(parseCampaignFields(base)).toMatchObject({ ok: true, value: { title: "Eid Kits 2027", unitPrice: 1500, maxUnits: 100, status: "DRAFT", opensAt: new Date("2027-02-18T03:30:00Z") } });
  });
  it.each([
    [{ title: "ab" }], [{ title: "x".repeat(81) }],
    [{ unitLabel: "" }], [{ unitLabel: "Kit 1" }], [{ unitLabelPlural: "k" }], [{ unitLabel: "x".repeat(21) }],
    [{ unitPrice: "0" }], [{ unitPrice: "-5" }], [{ unitPrice: "1500.50" }], [{ unitPrice: "1e3" }], [{ unitPrice: "10000000" }], [{ unitPrice: "" }], [{ unitPrice: "01500" }],
    [{ maxUnits: "0" }], [{ maxUnits: "1001" }], [{ maxUnits: "1.5" }], [{ maxUnits: "abc" }],
    [{ opensAt: "" }], [{ closesAt: "2027-02-30T09:00" }],
    [{ closesAt: "2027-02-18T09:00" }], [{ closesAt: "2027-02-18T08:00" }], [{ closesAt: "2027-09-01T09:00" }],
    [{ status: "LIVE" }], [{ status: undefined }],
    [{ note: "n".repeat(201) }], [{ note: "call 98765 43210" }], [{ title: "mail a@b.co" }],
  ])("rejects %j", override => expect(parseCampaignFields({ ...base, ...override }).ok).toBe(false));
  it("treats a blank note as none and lowercases unit names", () => {
    expect(parseCampaignFields({ ...base, note: "  ", unitLabel: "Kit", unitLabelPlural: "KITS" })).toMatchObject({ ok: true, value: { note: null, unitLabel: "kit", unitLabelPlural: "kits" } });
  });
});

describe("parseCreateCampaign", () => {
  it("needs a valid slug and fund", () => {
    expect(parseCreateCampaign({ ...base, slug: "eid-kits-2027", fundId: "fund_eid_kits" }).ok).toBe(true);
    for (const slug of ["", "A", "Eid Kits", "double--hyphen", "-x", "x-", "../x", "x".repeat(41)]) expect(parseCreateCampaign({ ...base, slug, fundId: "fund_eid_kits" }).ok).toBe(false);
    for (const fundId of ["", "ab", "has space", "x".repeat(65)]) expect(parseCreateCampaign({ ...base, slug: "eid-kits-2027", fundId }).ok).toBe(false);
  });
});

describe("statusTransitionAllowed", () => {
  it.each([
    ["DRAFT", "DRAFT", true], ["DRAFT", "ACTIVE", true], ["DRAFT", "CLOSED", true],
    ["ACTIVE", "ACTIVE", true], ["ACTIVE", "CLOSED", true], ["ACTIVE", "DRAFT", false],
    ["CLOSED", "CLOSED", true], ["CLOSED", "ACTIVE", false], ["CLOSED", "DRAFT", false],
  ] as const)("%s to %s is %s", (from, to, allowed) => expect(statusTransitionAllowed(from, to)).toBe(allowed));
});
