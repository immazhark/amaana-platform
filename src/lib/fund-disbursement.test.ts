import { describe, expect, it } from "vitest";
import { looksLikePersonalData, parseDisbursementInput, parseRupeesToPaise, validPublishableSummary, validVoidReason } from "./fund-disbursement";

const now = new Date("2026-11-19T06:00:00Z"); // 11:30 IST on 19 Nov 2026
const base = { fundId: "fund_orphan", pool: "NON_ZAKAT", amount: "50000", spentOn: "2026-11-18", title: "Stationery kits", publicSummary: "Kits for 25 children", };

describe("parseRupeesToPaise", () => {
  it.each([["50000", 5_000_000], ["0.5", 50], ["1250.75", 125_075], ["0.01", 1], ["10000000", 1_000_000_000]])("reads %s exactly", (input, paise) => expect(parseRupeesToPaise(input)).toBe(paise));
  it.each(["", "0", "0.00", "-5", "1e3", "1,000", "12.345", "00.5", " 5", "५०", "10000001", 5, null, undefined, "NaN", "Infinity"])("rejects %j", input => expect(parseRupeesToPaise(input)).toBeNull());
});

describe("parseDisbursementInput", () => {
  it("accepts a valid non-Zakat entry and derives the Indian financial year", () => {
    expect(parseDisbursementInput(base, now)).toEqual({ ok: true, value: { fundId: "fund_orphan", pool: "NON_ZAKAT", amountPaise: 5_000_000, spentOn: "2026-11-18", financialYear: "2026-27", title: "Stationery kits", publicSummary: "Kits for 25 children", zakatEligibilityBasis: null } });
  });
  it("puts 31 March and 1 April in different financial years", () => {
    const year = (spentOn: string) => { const r = parseDisbursementInput({ ...base, spentOn }, new Date("2027-06-01T00:00:00Z")); return r.ok ? r.value.financialYear : null; };
    expect(year("2027-03-31")).toBe("2026-27");
    expect(year("2027-04-01")).toBe("2027-28");
  });
  it.each([
    [{ fundId: "" }], [{ fundId: "bad id!" }], [{ pool: "OTHER" }], [{ pool: undefined }], [{ amount: "0" }], [{ amount: "12.345" }],
    [{ spentOn: "2026-11-20" }], [{ spentOn: "2026-02-30" }], [{ spentOn: "2019-12-31" }], [{ spentOn: "19/11/2026" }],
    [{ title: "ab" }], [{ title: "x".repeat(121) }], [{ publicSummary: "y".repeat(401) }],
    [{ title: "Call 9876543210" }], [{ publicSummary: "email donor@example.com" }], [{ publicSummary: "see https://x.example" }],
  ])("rejects %j", override => expect(parseDisbursementInput({ ...base, ...override }, now).ok).toBe(false));
  it("allows today and rejects tomorrow in IST", () => {
    expect(parseDisbursementInput({ ...base, spentOn: "2026-11-19" }, now).ok).toBe(true);
    expect(parseDisbursementInput({ ...base, spentOn: "2026-11-20" }, now).ok).toBe(false);
    expect(parseDisbursementInput({ ...base, spentOn: "2026-11-20" }, new Date("2026-11-19T19:00:00Z")).ok).toBe(true); // already 20 Nov in IST
  });
  it("requires recorded eligibility before Zakat money can be spent", () => {
    const zakat = { ...base, pool: "ZAKAT" };
    expect(parseDisbursementInput(zakat, now).ok).toBe(false);
    expect(parseDisbursementInput({ ...zakat, zakatEligibilityConfirmed: true }, now).ok).toBe(false);
    expect(parseDisbursementInput({ ...zakat, zakatEligibilityConfirmed: "true", zakatEligibilityBasis: "All recipients verified as eligible" }, now).ok).toBe(false);
    const ok = parseDisbursementInput({ ...zakat, zakatEligibilityConfirmed: true, zakatEligibilityBasis: "All recipients verified as eligible" }, now);
    expect(ok).toMatchObject({ ok: true, value: { pool: "ZAKAT", zakatEligibilityBasis: "All recipients verified as eligible" } });
  });
  it("does not keep an eligibility basis on a non-Zakat entry", () => {
    expect(parseDisbursementInput({ ...base, zakatEligibilityBasis: "not needed" }, now)).toMatchObject({ ok: true, value: { zakatEligibilityBasis: null } });
  });
});

describe("public text guards", () => {
  it("flags contact details but not amounts, counts or Indian-format figures", () => {
    for (const bad of ["a@b.co", "call 98765 43210", "+91 9876543210", "http://x", "(040) 2345 6789"]) expect(looksLikePersonalData(bad)).toBe(true);
    for (const fine of ["Paid 1,00,000 for fees", "25 children, 3 schools", "Term 2 fees for Class 8"]) expect(looksLikePersonalData(fine)).toBe(false);
  });
  it("only publishes a clean, substantial summary", () => {
    expect(validPublishableSummary("School fees for 12 children")).toBe(true);
    for (const bad of [null, "", "short", "x".repeat(401), "mail me a@b.co now"]) expect(validPublishableSummary(bad)).toBe(false);
  });
  it("needs a real void reason", () => {
    expect(validVoidReason("Entered twice")).toBe(true);
    for (const bad of [undefined, null, "", "no", "   ", "z".repeat(501), 5]) expect(validVoidReason(bad)).toBe(false);
  });
});
