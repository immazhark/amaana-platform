import { describe, expect, it } from "vitest";
import { parsePositiveRupeeAmount } from "./amount-entry";

describe("administrative rupee amount validation", () => {
  it.each(["1", "250", "107520", "482700.50", "0.01", "1000.0", "1000.00", "9999999999.99"])(
    "accepts valid rupee amounts %s", value => {
      expect(parsePositiveRupeeAmount(value, "Verified need")).toBe(Number(value));
    },
  );
  it.each(["", " ", "0", "0.00", "-1", "+10", "1e3", "Infinity", "NaN", "1,000", "10.001", "0010", "1.", ".5", "10000000000", "10000000000.01"])(
    "rejects malformed or out-of-range amount %s", value => {
      expect(() => parsePositiveRupeeAmount(value, "Approved target")).toThrow(/Approved target/);
    },
  );
  it("accepts empty optional verification inputs but not empty required appeal goals", () => {
    expect(parsePositiveRupeeAmount("", "Verified need", { optional: true })).toBeNull();
    expect(() => parsePositiveRupeeAmount("", "Appeal goal")).toThrow();
  });
});
