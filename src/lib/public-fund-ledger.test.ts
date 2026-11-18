import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import type { FundTotals } from "./giving-funds";
import { financialYearRange, resolveFinancialYear, selectableFinancialYears, shapePublicFundLedger } from "./public-fund-ledger";

const pool = (over: Partial<FundTotals["total"]> = {}) => ({ receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0, ...over });
const totals = (over: Partial<FundTotals["total"]>): FundTotals => ({ zakat: pool(), nonZakat: pool(), total: pool(over) });
const orphan = { id: "f1", slug: "orphan", name: "Orphan Fund", summary: "s", zakatPolicy: "ACCEPTED" as const };
const dates = { id: "f2", slug: "dates", name: "Dates Fund", summary: "s", zakatPolicy: "NOT_ACCEPTED" as const };

describe("financial year ranges", () => {
  it("runs from 1 April to 31 March in IST as a half-open UTC range", () => {
    const range = financialYearRange("2026-27");
    expect(range?.start.toISOString()).toBe("2026-03-31T18:30:00.000Z");
    expect(range?.end.toISOString()).toBe("2027-03-31T18:30:00.000Z");
  });
  it.each(["", "2026", "2026-28", "2026-2027", "26-27", "2026/27", "2026-27 ", "0000-01", "2100-01", "abcd-ef"])("rejects %j", label => expect(financialYearRange(label)).toBeNull());
  it("accepts the century rollover", () => expect(financialYearRange("2099-00")).not.toBeNull());
});

describe("selectable years", () => {
  it("offers the current year first and nothing before the ledger opened", () => {
    expect(selectableFinancialYears(new Date("2026-11-19T00:00:00Z"))).toEqual(["2026-27"]);
    expect(selectableFinancialYears(new Date("2028-05-01T00:00:00Z"))).toEqual(["2028-29", "2027-28", "2026-27"]);
    expect(selectableFinancialYears(new Date("2025-01-01T00:00:00Z"))).toEqual(["2026-27"]);
  });
  it("falls back to the current year for anything the ledger does not offer", () => {
    const now = new Date("2028-05-01T00:00:00Z");
    expect(resolveFinancialYear("2027-28", now).label).toBe("2027-28");
    for (const bad of ["2020-21", "2099-00", "junk", "", undefined, ["2027-28"]]) expect(resolveFinancialYear(bad as never, now).label).toBe("2028-29");
  });
});

describe("shapePublicFundLedger", () => {
  it("shows verified receipts and published spending only, with held funds to date", () => {
    const { rows, totals: sum } = shapePublicFundLedger({
      funds: [orphan, dates],
      inYear: { f1: totals({ receivedPaise: 1_000_000, spentPaise: 900_000, publishedSpentPaise: 400_000 }) },
      toDate: { f1: totals({ receivedPaise: 1_500_000, spentPaise: 900_000, publishedSpentPaise: 400_000 }) },
      entries: [{ id: "e1", fundId: "f1", title: "Stationery", publicSummary: null, amountPaise: 400_000, spentOn: "2026-11-01", pool: "NON_ZAKAT" }],
    });
    expect(rows[0]).toMatchObject({ receivedPaise: 1_000_000, spentPaise: 400_000, heldPaise: 1_100_000, spentShare: 0.4 });
    expect(rows[0]?.entries).toHaveLength(1);
    expect(rows[1]).toMatchObject({ receivedPaise: 0, spentPaise: 0, heldPaise: 0, spentShare: 0, entries: [] });
    expect(sum).toEqual({ receivedPaise: 1_000_000, spentPaise: 400_000, heldPaise: 1_100_000 });
  });
  it("never shows a negative held amount or a spent share above 100 percent", () => {
    const { rows } = shapePublicFundLedger({
      funds: [orphan],
      inYear: { f1: totals({ receivedPaise: 100, publishedSpentPaise: 500 }) },
      toDate: { f1: totals({ receivedPaise: 100, publishedSpentPaise: 500 }) },
      entries: [],
    });
    expect(rows[0]).toMatchObject({ heldPaise: 0, spentShare: 1 });
  });
  it("ignores spending entries that belong to another fund", () => {
    const { rows } = shapePublicFundLedger({
      funds: [dates], inYear: {}, toDate: {},
      entries: [{ id: "e1", fundId: "f1", title: "x", publicSummary: null, amountPaise: 1, spentOn: "2026-11-01", pool: "ZAKAT" }],
    });
    expect(rows[0]?.entries).toEqual([]);
  });
});
