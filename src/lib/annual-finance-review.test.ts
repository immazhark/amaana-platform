import { describe, expect, it } from "vitest";
import { annualFinanceCrossCsv, annualFinanceCsv, financeReviewPeriod } from "./annual-finance-review";

describe("annual finance review contract", () => {
  it("uses IST and half-open dates; rejects repeated, malformed and future years", () => {
    const now = new Date("2026-11-26T00:00:00Z");
    const period = financeReviewPeriod("2026-27", now);
    expect(period.start.toISOString()).toBe("2026-03-31T18:30:00.000Z");
    expect(period.end.toISOString()).toBe("2027-03-31T18:30:00.000Z");
    for (const invalid of [["2025-26"], "2027-28", "2026-28", "junk"]) expect(financeReviewPeriod(invalid, now).label).toBe("2026-27");
    expect(financeReviewPeriod("2020-21", now).label).toBe("2020-21");
    expect(financeReviewPeriod(undefined, new Date("2027-03-31T18:30:00Z")).label).toBe("2027-28");
  });

  it("writes fixed columns, exact decimal amounts and spreadsheet-safe text", () => {
    const csv = annualFinanceCsv("2026-27", [{ destination: "fund", fundSlug: "=danger", pool: "NON_ZAKAT", grossPaise: 101, refundedPaise: 1, retainedPaise: 100, pendingPaise: 0, pendingCount: 0, draftPaise: 0, publishedPaise: 12 }]);
    expect(csv).toContain("capture_cohort_cumulative_principal_refunded_inr");
    expect(csv).toContain("\"'=danger\"");
    expect(csv).toContain("1.01,0.01,1.00,0.00,0,0.00,0.12");
    expect(csv).not.toMatch(/donorEmail|donorName|tax_certificate/i);
  });
});

it("exports the joint destination and channel view with exact decimal amounts and no spending or identity", () => {
  const csv = annualFinanceCrossCsv("2026-27", [{ destination: "fund", fundSlug: "=danger", pool: "NON_ZAKAT", paymentMethod: "RAZORPAY", grossPaise: 101, refundedPaise: 1, retainedPaise: 100, pendingPaise: 0, pendingCount: 0 }]);
  expect(csv).toBe("financial_year,destination,fund_slug,pool,payment_method,capture_cohort_gross_inr,capture_cohort_cumulative_principal_refunded_inr,capture_cohort_retained_inr,pending_claims_created_inr,pending_claim_count\r\n" + "\"2026-27\",\"fund\",\"'=danger\",\"NON_ZAKAT\",\"RAZORPAY\",1.01,0.01,1.00,0.00,0\r\n");
  expect(csv).not.toMatch(/donor|spending|tax_certificate/i);
});
