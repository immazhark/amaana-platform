import { describe, expect, it } from "vitest";
import { donationAmountValidationMessage, getUpiPaymentUri, updateDonationAmountValidity } from "./donation-amount-input";

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
});


describe("AF-R083 reviewed checkout amount presets", () => {
  it("never suggests more than the verified remaining appeal balance", async () => {
    const { getDonationAmountPresets } = await import("./donation-amount-input");
    expect(getDonationAmountPresets(900)).toEqual([500, 900]);
    expect(getDonationAmountPresets(2_500)).toEqual([500, 1_000, 2_500]);
    expect(getDonationAmountPresets(3_750)).toEqual([500, 1_000, 2_500, 3_750]);
    expect(getDonationAmountPresets(100_000)).toEqual([500, 1_000, 2_500]);
  });

  it("uses only the exact payable amount for a fully-rupee balance below ₹10", async () => {
    const { getDonationAmountPresets } = await import("./donation-amount-input");
    expect(getDonationAmountPresets(7)).toEqual([7]);
    expect(getDonationAmountPresets(9.5)).toEqual([]);
  });

  it("does not offer checkout shortcuts for invalid or exhausted balances", async () => {
    const { getDonationAmountPresets } = await import("./donation-amount-input");
    for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
      expect(getDonationAmountPresets(invalid)).toEqual([]);
    }
    expect(getDonationAmountPresets(500.75)).toEqual([500]);
    expect(getDonationAmountPresets(1_500_000)).toEqual([500, 1_000, 2_500]);
  });
});

describe("verified amount-prefilled direct UPI links", () => {
  it("encodes the confirmed whole-rupee amount without changing the payment destination", () => {
    const id = "mab.037347029220157@axisbank";
    expect(getUpiPaymentUri(id, "250", 10, 500)).toBe(
      "upi://pay?pa=mab.037347029220157%40axisbank&pn=AMAANA%20FOUNDATION&am=250.00&cu=INR",
    );
    expect(getUpiPaymentUri(id, "7", 7, 7)).toContain("&am=7.00&cu=INR");
  });

  it("does not create a payment intent for an unset or invalid amount", () => {
    const id = "verified@upi";
    for (const value of ["", "0", "9", "501", "250.75", "1e2", "-1", "Infinity"]) {
      expect(getUpiPaymentUri(id, value, 10, 500)).toBeNull();
    }
    expect(getUpiPaymentUri("verified@upi&am=1000", "250", 10, 500)).toBeNull();
  });
});
