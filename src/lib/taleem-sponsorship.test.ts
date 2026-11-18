import { describe, expect, it } from "vitest";
import { TALEEM_CATALOGUE, type TaleemCatalogue } from "@/content/taleem-catalogue";
import { SPONSORSHIP_MONTH_OPTIONS, isCheckoutEnabled, quoteSponsorship } from "./taleem-sponsorship";

const approved: TaleemCatalogue = {
  version: "test-1",
  programmes: TALEEM_CATALOGUE.programmes.map(programme => ({ ...programme, approval: "APPROVED" as const })),
};

describe("Taleem sponsorship pricing", () => {
  it("prices every programme and duration from the approved rate in integer paise", () => {
    const expected: Record<string, number[]> = {
      qaida: [100_000, 300_000, 600_000, 1_200_000],
      nazira: [120_000, 360_000, 720_000, 1_440_000],
      "hifdh-day-scholar": [150_000, 450_000, 900_000, 1_800_000],
    };
    for (const [programmeId, totals] of Object.entries(expected)) {
      SPONSORSHIP_MONTH_OPTIONS.forEach((months, index) => {
        const result = quoteSponsorship({ programmeId, units: 1, months }, approved);
        expect(result).toMatchObject({ ok: true, quote: { totalPaise: totals[index] } });
      });
    }
  });

  it("multiplies units on the server (3 Nazira x 12 months = 43,200 rupees; 2 Hifdh x 6 months = 18,000)", () => {
    expect(quoteSponsorship({ programmeId: "nazira", units: 3, months: 12 }, approved)).toMatchObject({ ok: true, quote: { totalPaise: 4_320_000, monthlyPaise: 360_000 } });
    expect(quoteSponsorship({ programmeId: "hifdh-day-scholar", units: 2, months: 6 }, approved)).toMatchObject({ ok: true, quote: { totalPaise: 1_800_000 } });
  });

  it("records the rate version used so later rate changes cannot rewrite the quote", () => {
    const result = quoteSponsorship({ programmeId: "qaida", units: 1, months: 1 }, approved);
    expect(result.ok && result.quote.rateVersion).toBe("test-1");
  });

  it.each([
    [{ programmeId: "qaida", units: 0, months: 1 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: -1, months: 1 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: 1.5, months: 1 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: "2", months: 1 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: Number.MAX_SAFE_INTEGER, months: 12 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: Number.NaN, months: 1 }, "INVALID_UNITS"],
    [{ programmeId: "qaida", units: 1, months: 2 }, "INVALID_DURATION"],
    [{ programmeId: "qaida", units: 1, months: 24 }, "INVALID_DURATION"],
    [{ programmeId: "qaida", units: 1, months: "12" }, "INVALID_DURATION"],
    [{ programmeId: "unknown", units: 1, months: 1 }, "UNKNOWN_PROGRAMME"],
    [{ programmeId: "__proto__", units: 1, months: 1 }, "UNKNOWN_PROGRAMME"],
    [{ programmeId: "constructor", units: 1, months: 1 }, "UNKNOWN_PROGRAMME"],
    [null, "UNKNOWN_PROGRAMME"],
  ])("rejects malformed input %j", (input, code) => {
    expect(quoteSponsorship(input, approved)).toEqual({ ok: false, code });
  });

  it("ignores any client-supplied money fields", () => {
    const result = quoteSponsorship({ programmeId: "qaida", units: 1, months: 1, total: 1, amountPaise: 1, monthlyPaise: 1 }, approved);
    expect(result).toMatchObject({ ok: true, quote: { totalPaise: 100_000 } });
  });

  it("does not offer a programme that is not available", () => {
    const closed: TaleemCatalogue = { ...approved, programmes: approved.programmes.map(p => ({ ...p, available: p.id === "qaida" ? false : p.available })) };
    expect(quoteSponsorship({ programmeId: "qaida", units: 1, months: 1 }, closed)).toEqual({ ok: false, code: "PROGRAMME_UNAVAILABLE" });
    expect(quoteSponsorship({ programmeId: "nazira", units: 1, months: 1 }, closed).ok).toBe(true);
  });

  it("keeps live checkout off until the owner approves the rate", () => {
    const baseline = quoteSponsorship({ programmeId: "qaida", units: 1, months: 1 });
    expect(baseline.ok && isCheckoutEnabled(baseline.quote)).toBe(false);
    const live = quoteSponsorship({ programmeId: "qaida", units: 1, months: 1 }, approved);
    expect(live.ok && isCheckoutEnabled(live.quote)).toBe(true);
  });

  it("ships the baseline catalogue as unapproved and with no staff range offered as a price", () => {
    expect(TALEEM_CATALOGUE.programmes.every(p => p.approval === "BASELINE_PENDING_APPROVAL")).toBe(true);
    expect(TALEEM_CATALOGUE.programmes.map(p => p.id)).toEqual(["qaida", "nazira", "hifdh-day-scholar"]);
  });
});
