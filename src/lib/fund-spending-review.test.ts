import { describe, expect, it } from "vitest";
import { spendingFilters, summarizeSpending } from "./fund-spending-review";

const money = (amount: number) => ({ toNumber: () => amount });

describe("spending review filters", () => {
  it("intersects supported values and ignores unsupported, unknown and repeated values", () => {
    expect(spendingFilters({ fund: "f1", fy: "2026-27", pool: "ZAKAT", status: "DRAFT" }, ["f1", "f2"], ["2026-27"])).toEqual({ fundId: "f1", financialYear: "2026-27", pool: "ZAKAT", status: "DRAFT" });
    expect(spendingFilters({ fund: ["f1"], fy: "2025-27", pool: "x", status: ["VOID"] }, ["f1"], ["2026-27"])).toEqual({});
    expect(spendingFilters({ fund: "unknown", fy: "2025-26" }, ["f1"], ["2026-27"])).toEqual({});
  });
});

describe("spending review totals", () => {
  it("counts all matching entries and excludes void entries from recorded spending", () => {
    expect(summarizeSpending([
      { status: "DRAFT", _count: { _all: 50 }, _sum: { amount: money(110.25) } },
      { status: "PUBLISHED", _count: { _all: 80 }, _sum: { amount: money(200.15) } },
      { status: "VOID", _count: { _all: 2 }, _sum: { amount: money(7.01) } },
    ])).toEqual({ totalItems: 132, recordedPaise: 31040, draftPaise: 11025, publishedPaise: 20015, voidPaise: 701 });
  });

  it("keeps empty and void-only views from claiming recorded spending", () => {
    expect(summarizeSpending([])).toEqual({ totalItems: 0, recordedPaise: 0, draftPaise: 0, publishedPaise: 0, voidPaise: 0 });
    expect(summarizeSpending([{ status: "VOID", _count: { _all: 1 }, _sum: { amount: money(10) } }])).toEqual({ totalItems: 1, recordedPaise: 0, draftPaise: 0, publishedPaise: 0, voidPaise: 1000 });
  });
});
