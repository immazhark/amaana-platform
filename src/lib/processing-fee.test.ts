import { describe, expect, it } from "vitest";
import { DEFAULT_FEE_ESTIMATE_BPS, calculateFeeCover, feeEstimateBasisPoints } from "./processing-fee";

describe("processing fee cover", () => {
  it("grosses up so the fund keeps the full chosen amount after the gateway deduction", () => {
    for (const intended of [1_000, 100_000, 500_000, 1_234_567, 100_000_000]) {
      const { feePaise, totalPaise } = calculateFeeCover(intended, 236);
      expect(totalPaise).toBe(intended + feePaise);
      const afterGateway = totalPaise - Math.ceil((totalPaise * 236) / 10_000);
      expect(afterGateway).toBeGreaterThanOrEqual(intended - 1);
      expect(feePaise).toBeGreaterThan(0);
    }
  });
  it("gives a worked example: 5,000 rupees at 2.36% needs a 120.86-rupee cover (rounded up)", () => {
    expect(calculateFeeCover(500_000, 236)).toEqual({ feePaise: 12_086, totalPaise: 512_086 });
  });
  it("adds nothing at a zero rate", () => {
    expect(calculateFeeCover(500_000, 0)).toEqual({ feePaise: 0, totalPaise: 500_000 });
  });
  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER, Infinity])("rejects intended amount %s", value => {
    expect(() => calculateFeeCover(value, 236)).toThrow(RangeError);
  });
  it.each([-1, 1.5, 1001, Number.NaN])("rejects rate %s", bps => {
    expect(() => calculateFeeCover(100_000, bps)).toThrow(RangeError);
  });
  it("reads a valid configured rate and falls back to the default for anything else", () => {
    expect(feeEstimateBasisPoints("250")).toBe(250);
    expect(feeEstimateBasisPoints("0")).toBe(0);
    for (const bad of [undefined, "", "abc", "-5", "1.5", "99999", "1001", "２３６"]) expect(feeEstimateBasisPoints(bad)).toBe(DEFAULT_FEE_ESTIMATE_BPS);
  });
});
