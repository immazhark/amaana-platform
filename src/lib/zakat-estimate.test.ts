import { describe, expect, it } from "vitest";
import { calculateZakatEstimate, formatZakatPaise, parseZakatAmount,
  type ZakatEstimateInput } from "./zakat-estimate";
const input: ZakatEstimateInput = {
  cash: "100000", metals: "20000.05", investments: "10000",
  inventory: "5000", receivables: "5000.10",
  liabilities: "15000", nisab: "70000", hawl: "yes",
};
describe("Zakat educational estimate, exact paise, explicit nisab/hawl", () => {
  it("totals INR assets/liabilities and computes 1/40 without floating-point drift", () => {
    expect(calculateZakatEstimate(input)).toEqual({
      status: "estimated", assetsPaise: 14000015n, liabilitiesPaise: 1500000n,
      netPaise: 12500015n, nisabPaise: 7000000n, zakatPaise: 312500n,
    });
    expect(formatZakatPaise(312500n)).toBe("₹3,125.00");
  });
  it("rounds half a paise upwards", () => {
    expect(calculateZakatEstimate({ ...input, cash: "100.20",
      metals: "", investments: "", inventory: "", receivables: "",
      liabilities: "0", nisab: "1" }).zakatPaise).toBe(251n);
  });
  it("cannot show due Zakat below nisab or without a confirmed lunar year", () => {
    expect(calculateZakatEstimate({ ...input, nisab: "125000.16" }).status).toBe("below_nisab");
    for (const hawl of ["no", "unsure"] as const) {
      const result = calculateZakatEstimate({ ...input, hawl });
      expect(result.status).toBe("hawl_unconfirmed");
      expect(result.zakatPaise).toBe(0n);
    }
  });
  it("rejects missing, zero or malformed nisab without using live prices", () => {
    expect(calculateZakatEstimate({ ...input, nisab: "" }).status).toBe("missing_nisab");
    expect(calculateZakatEstimate({ ...input, nisab: "0" }).status).toBe("invalid_input");
  });
  it("clamps net monetary wealth to zero if liabilities exceed assets", () => {
    expect(calculateZakatEstimate({ ...input, liabilities: "9999999999" }).netPaise).toBe(0n);
  });
  it.each(["-1", "1e9", "0x10", "1,000", "1.001", ".50", "01.00",
    "NaN", "Infinity", "99999999999999", "1\n2"])("rejects %s as INR amount", amount => {
    expect(parseZakatAmount(amount)).toBeNull();
  });
  it("supports large INR sums with exact two-decimal Indian formatting", () => {
    expect(parseZakatAmount("9999999999999.99")).toBe(999999999999999n);
    expect(formatZakatPaise(999999999999999n)).toBe("₹99,99,99,99,99,999.99");
  });
  it("rejects bad asset/debt/form values rather than leaking partial calculations", () => {
    for (const delta of [{ cash: "-1" }, { investments: "1.234" },
      { liabilities: "-100" }, { hawl: "bad" as "yes" }]) {
      const result = calculateZakatEstimate({ ...input, ...delta });
      expect(result.status).toBe("invalid_input");
      expect(result.zakatPaise).toBe(0n);
    }
  });
});
