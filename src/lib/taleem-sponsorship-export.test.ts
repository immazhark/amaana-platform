import { describe, expect, it } from "vitest";
import { summarizeTaleemSponsorship } from "./taleem-sponsorship-export";
const row = { programme: "qaida", monthlyRate: 900, rateVersion: "historic", verifiedCount: 2, grossCaptured: 1800, principalRefunded: 0.01, netRetained: 1799.99, pendingCount: 1, pendingAmount: 900, verifiedQuotedUnitMonths: 2, retainedWholeUnitMonths: 1, retainedRemainder: 899.99, pendingQuotedUnitMonths: 1 };
describe("Taleem sponsorship aggregate export", () => {
  it("conserves exact paise across historical cohorts without adding rate equivalents", () => {
    const second = { ...row, monthlyRate: 1000, rateVersion: "new", grossCaptured: 2000, principalRefunded: 100, netRetained: 1900, retainedRemainder: 900, pendingAmount: 1000 };
    const result = summarizeTaleemSponsorship("2026-27", [row, second]);
    expect(result.totals).toEqual({ verifiedCount: 4, grossPaise: 380000, refundedPaise: 10001, retainedPaise: 369999, pendingCount: 2, pendingPaise: 190000 });
    expect(result.csv).toContain('"2026-27","qaida",900.00,"historic",2,1800.00,0.01,1799.99,1,900.00,2,1,899.99,1\r\n');
    expect(result.csv.split("\r\n")).toHaveLength(4);
  });
  it("neutralizes spreadsheet formulas and quotes untrusted text", () => {
    const result = summarizeTaleemSponsorship("all", [{ ...row, programme: "=1+1", rateVersion: '  @bad"x' }]);
    expect(result.csv).toContain("\"'=1+1\"");
    expect(result.csv).toContain("\"'  @bad\"\"x\"");
  });
  it("rejects inconsistent, duplicate, unsafe, negative or non-cent inputs", () => {
    for (const input of [{ ...row, grossCaptured: NaN }, { ...row, pendingAmount: 0.001 }, { ...row, pendingCount: -1 }, { ...row, netRetained: 1800 }, { ...row, retainedWholeUnitMonths: 2 }, { ...row, retainedRemainder: 900 }, { ...row, monthlyRate: 0 }, { ...row, verifiedCount: 1.5 }]) expect(() => summarizeTaleemSponsorship("all", [input])).toThrow();
    expect(() => summarizeTaleemSponsorship("all", [row, row])).toThrow();
    for (const scope of ["2026-28", "private", "2026-2027"]) expect(() => summarizeTaleemSponsorship(scope, [row])).toThrow();
    expect(() => summarizeTaleemSponsorship("all", [{ ...row, verifiedCount: Number.MAX_SAFE_INTEGER }, { ...row, rateVersion: "new" }])).toThrow();
  });
  it("keeps an empty aggregate explicit", () => {
    const result = summarizeTaleemSponsorship("all", []);
    expect(result.totals).toEqual({ verifiedCount: 0, grossPaise: 0, refundedPaise: 0, retainedPaise: 0, pendingCount: 0, pendingPaise: 0 });
    expect(result.csv.split("\r\n")).toHaveLength(2);
  });
});
