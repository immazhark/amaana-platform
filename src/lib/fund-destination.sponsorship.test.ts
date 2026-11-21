import { describe, expect, it } from "vitest";
import { resolveFundDestination } from "./fund-destination";

const taleem = { id: "fund_taleem", slug: "taleem", name: "Taleem Fund", zakatPolicy: "ACCEPTED" as const, isGeneral: false };
const dates = { id: "fund_dates", slug: "dates", name: "Dates Fund", zakatPolicy: "NOT_ACCEPTED" as const, isGeneral: false };
const general = { id: "fund_general", slug: "general", name: "General Fund", zakatPolicy: "ACCEPTED" as const, isGeneral: true };
const clientFor = (fund: typeof taleem | null) => ({ fund: { findFirst: async () => fund } });
const open = { sponsorshipEnabled: true } as const;

describe("Taleem sponsorship destination (server-authoritative price)", () => {
  it("prices a one-unit, three-month Qaida sponsorship and records the per-unit monthly rate with its version", async () => {
    const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", amount: 3000, sponsorship: { programmeId: "qaida", units: 1, months: 3 }, ...open });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ fundId: "fund_taleem", sponsorship: { programme: "qaida", units: 1, months: 3, monthlyRate: 1000, rateVersion: "approved-2026-11" } }) });
  });

  it("stores the rate per unit, not the monthly total, so amount = units x months x rate", async () => {
    const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "GENERAL", amount: 27000, sponsorship: { programmeId: "hifdh-day-scholar", units: 3, months: 6 }, ...open });
    expect(result.ok && result.value.sponsorship).toEqual({ programme: "hifdh-day-scholar", units: 3, months: 6, monthlyRate: 1500, rateVersion: "approved-2026-11" });
    expect(3 * 6 * 1500).toBe(27000);
  });

  it("stays closed unless the live flag is passed in", async () => {
    for (const flag of [{}, { sponsorshipEnabled: false }] as const) {
      const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", amount: 3000, sponsorship: { programmeId: "qaida", units: 1, months: 3 }, ...flag });
      expect(result).toEqual({ ok: false, status: 409, error: "Taleem sponsorship is not open yet." });
    }
  });

  it("refuses a client amount that differs from the server's price, or a missing amount", async () => {
    for (const amount of [100, 2999, 3001, 30000, undefined]) {
      const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", ...(amount === undefined ? {} : { amount }), sponsorship: { programmeId: "qaida", units: 1, months: 3 }, ...open });
      expect(result).toEqual({ ok: false, status: 409, error: "The sponsorship price has changed. Please reload the page and try again." });
    }
  });

  it.each([
    ["an unknown programme", { programmeId: "hifdh-boarding", units: 1, months: 1 }, "Please choose a Taleem programme."],
    ["zero units", { programmeId: "qaida", units: 0, months: 1 }, "Please choose between 1 and 50 units."],
    ["more than 50 units", { programmeId: "qaida", units: 51, months: 1 }, "Please choose between 1 and 50 units."],
    ["a duration that is not offered", { programmeId: "qaida", units: 1, months: 2 }, "Please choose 1, 3, 6 or 12 months."],
  ])("rejects %s with a 400", async (_name, sponsorship, error) => {
    const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", amount: 1000, sponsorship, ...open });
    expect(result).toEqual({ ok: false, status: 400, error });
  });

  it("is only for the Taleem fund", async () => {
    for (const fund of [dates, general]) {
      const result = await resolveFundDestination(clientFor(fund as typeof taleem), { fundSlug: fund.slug, givingIntent: "SADAQAH", amount: 3000, sponsorship: { programmeId: "qaida", units: 1, months: 3 }, ...open });
      expect(result).toEqual({ ok: false, status: 400, error: "Programme sponsorship is only available for the Taleem Fund." });
    }
  });

  it("is never combined with a campaign or a custom request", async () => {
    const sponsorship = { programmeId: "qaida", units: 1, months: 3 };
    const withCampaign = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", amount: 3000, campaignSlug: "x", units: 1, sponsorship, ...open });
    const withDirective = await resolveFundDestination(clientFor(general), { fundSlug: "general", givingIntent: "SADAQAH", amount: 3000, donorDirective: "please", sponsorship, ...open });
    for (const result of [withCampaign, withDirective]) expect(result).toEqual({ ok: false, status: 400, error: expect.stringMatching(/cannot be combined|only be added|only available/) });
  });

  it("lets a donor give Zakat to the Taleem fund, because the owner ruled it Zakat-accepting", async () => {
    const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "ZAKAT", amount: 1000, sponsorship: { programmeId: "qaida", units: 1, months: 1 }, ...open });
    expect(result.ok).toBe(true);
  });

  it("leaves an ordinary fund gift untouched when no sponsorship is sent", async () => {
    const result = await resolveFundDestination(clientFor(taleem), { fundSlug: "taleem", givingIntent: "SADAQAH", amount: 777 });
    expect(result).toEqual({ ok: true, value: expect.not.objectContaining({ sponsorship: expect.anything() }) });
  });
});
