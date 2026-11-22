import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TALEEM_CATALOGUE, type TaleemCatalogue } from "@/content/taleem-catalogue";
import { TaleemFees, taleemFeeRows } from "./taleem-fees";

const text = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

describe("Taleem programme fees", () => {
  it("shows all three owner-confirmed monthly fees on the overview, from the price source", () => {
    expect(taleemFeeRows("taleem").map(row => [row.id, row.monthlyRupees])).toEqual([["qaida", 1000], ["nazira", 1200], ["hifdh-day-scholar", 1500]]);
    const copy = text(<TaleemFees slug="taleem" />);
    for (const expected of ["Qaida ₹1,000", "Qur'an Nazira ₹1,200", "Hifdh — Day Scholar ₹1,500"]) expect(copy).toContain(expected);
    expect(copy).toContain("a month for each student");
  });

  it("shows only a programme's own fee on its page", () => {
    expect(taleemFeeRows("taleem-nazira-sponsorship").map(row => row.id)).toEqual(["nazira"]);
    expect(taleemFeeRows("taleem-hifdh-sponsorship").map(row => row.id)).toEqual(["hifdh-day-scholar"]);
    expect(text(<TaleemFees slug="taleem-hifdh-sponsorship" />)).toContain("The programme fee");
  });

  it("renders nothing for any other page, so other programmes are unchanged", () => {
    for (const slug of ["taleem-school-college-sponsorship", "taleem-initiative-2025", "winter-relief", "", "TALEEM"]) {
      expect(taleemFeeRows(slug)).toEqual([]);
      expect(renderToStaticMarkup(<TaleemFees slug={slug} />)).toBe("");
    }
  });

  it("never states a fee for a programme that is unavailable, not approved, or not whole rupees", () => {
    const catalogue: TaleemCatalogue = { version: "test", programmes: [
      { ...TALEEM_CATALOGUE.programmes[0]!, available: false },
      { ...TALEEM_CATALOGUE.programmes[1]!, approval: "BASELINE_PENDING_APPROVAL" },
      { ...TALEEM_CATALOGUE.programmes[2]!, monthlyPaise: 150_050 },
    ] };
    expect(taleemFeeRows("taleem", catalogue)).toEqual([]);
    expect(renderToStaticMarkup(<TaleemFees slug="taleem" catalogue={catalogue} />)).toBe("");
  });

  it("makes no claim about coverage, discounts or the Madarsah's own fees", () => {
    const copy = text(<TaleemFees slug="taleem" />);
    for (const forbidden of [/discount/i, /save/i, /full(y)? cover/i, /annual (fee|package)/i, /per year/i, /covers? (all|everything)/i]) expect(copy).not.toMatch(forbidden);
    expect(copy).toContain("not a statement of what the Madarsah itself charges");
  });
});
