import { describe, expect, it } from "vitest";
import { spendingFilters, summarizeSpending, spendingReviewCsv } from "./fund-spending-review";

const money = (amount: number) => ({ toString: () => String(amount) });

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

describe("exact spending aggregate and scoped export", () => {
  const group = (status: "DRAFT" | "PUBLISHED" | "VOID", amount: string | null, count = 1) => ({ status, _count: { _all: count }, _sum: { amount: amount === null ? null : { toString: () => amount } } });
  it("rejects invalid, duplicate and unsafe grouped amounts and counts", () => {
    for (const row of [group("DRAFT", "-1"), group("DRAFT", "1.001"), group("VOID", null), group("PUBLISHED", "NaN"), group("DRAFT", "2", -1), group("DRAFT", "2", 1.5), group("DRAFT", "35184372088832"), group("DRAFT", "0")]) expect(() => summarizeSpending([row])).toThrow();
    expect(() => summarizeSpending([group("DRAFT", "1"), group("DRAFT", "2")])).toThrow();
    expect(() => summarizeSpending([group("DRAFT", "20000000000000"), group("PUBLISHED", "20000000000000")])).toThrow();
    expect(() => summarizeSpending([group("DRAFT", "1", Number.MAX_SAFE_INTEGER), group("VOID", "1")])).toThrow();
    expect(() => summarizeSpending([{ ...group("DRAFT", "1"), status: "OTHER" as never }])).toThrow();
  });
  it("exports exact filtered aggregates in stable order, with void amounts separate", () => {
    const rows = [group("VOID", "7.01", 2), group("DRAFT", "110.25", 50), group("PUBLISHED", "200.15", 80)];
    expect(spendingReviewCsv({ fund: "f1", fy: "2026-27", pool: "ZAKAT", status: "" }, rows)).toBe('fund_filter_id,financial_year_filter,pool_filter,status_filter,entry_status,entry_count,recorded_amount_inr,void_amount_inr\r\n"f1","2026-27","ZAKAT","all","DRAFT",50,110.25,0.00\r\n"f1","2026-27","ZAKAT","all","PUBLISHED",80,200.15,0.00\r\n"f1","2026-27","ZAKAT","all","VOID",2,0.00,7.01\r\n');
    expect(spendingReviewCsv({ fund: "=1+1", fy: "", pool: "", status: "VOID" }, [group("VOID", "1")])).toContain("\"'=1+1\",\"all\",\"all\",\"VOID\",\"VOID\",1,0.00,1.00");
    expect(() => spendingReviewCsv({ fund: "", fy: "", pool: "", status: "VOID" }, [group("DRAFT", "1")])).toThrow();
  });
});
