import { describe, expect, it } from "vitest";
import { donationAmountValidationMessage, updateDonationAmountValidity, getWholeRupeeCheckoutRange } from "./donation-amount-input";

describe("donation amount input validation", () => {
  const min = 10;
  const max = 5_000;
  it.each(["10", "250", "5000", "00025"])("accepts valid whole-rupee amount %s", value => {
    expect(donationAmountValidationMessage(value, min, max)).toBe("");
  });
  it.each(["-10", "1.5", "1e3", "₹100", "1,000", " 100 ", "Infinity"])(
    "rejects malformed numeric amount %s", value => {
      expect(donationAmountValidationMessage(value, min, max)).toMatch(/digits only/);
    },
  );
  it("allows the native required constraint to report empty values", () => {
    expect(donationAmountValidationMessage("", min, max)).toBe("");
  });
  it("enforces the minimum and current remaining balance", () => {
    expect(donationAmountValidationMessage("9", min, max)).toContain("₹10");
    expect(donationAmountValidationMessage("5001", min, max)).toContain("₹5,000");
    expect(donationAmountValidationMessage("7", 7, 7)).toBe("");
    expect(donationAmountValidationMessage("8", 7, 7)).toContain("₹7");
  });
  it("rejects unsafe integers even when the characters are digits", () => {
    expect(donationAmountValidationMessage("9007199254740993", 1, Number.MAX_SAFE_INTEGER))
      .toMatch(/valid whole-rupee/);
  });
  it("sets and clears the custom validity message", () => {
    let recorded = "";
    const control = { value: "5001", setCustomValidity: (message: string) => { recorded = message; } };
    updateDonationAmountValidity(control as HTMLInputElement, min, max);
    expect(recorded).toContain("₹5,000");
    control.value = "500";
    updateDonationAmountValidity(control as HTMLInputElement, min, max);
    expect(recorded).toBe("");
  });
  it("derives only server-payable whole-rupee appeal ranges", () => {
    expect(getWholeRupeeCheckoutRange(400.30)).toEqual({ minimum: 10, maximum: 400 });
    expect(getWholeRupeeCheckoutRange(10.01)).toEqual({ minimum: 10, maximum: 10 });
    expect(getWholeRupeeCheckoutRange(9)).toEqual({ minimum: 9, maximum: 9 });
    expect(getWholeRupeeCheckoutRange(1)).toEqual({ minimum: 1, maximum: 1 });
    expect(getWholeRupeeCheckoutRange(1_000_000.9)).toEqual({ minimum: 10, maximum: 1_000_000 });
  });
  it.each([9.99, 5.5, 0.99, 0.01, 0, -1, NaN, Infinity])(
    "refuses to advertise a checkout for impossible balance %s", remaining => {
      expect(getWholeRupeeCheckoutRange(remaining)).toBeNull();
    },
  );
});
