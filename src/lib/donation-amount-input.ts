/**
 * Browser-only validation for whole-rupee inputs. The server remains
 * authoritative; this provides accessible constraint feedback without
 * spinbutton controls, exponent notation, or fractional rupees.
 */
export function donationAmountValidationMessage(value: string, minimum: number, maximum: number): string {
  if (!value) return ""; // HTML required constraint handles empty values.
  if (!/^[0-9]+$/.test(value)) return "Enter a whole-rupee amount using digits only.";
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) return "Enter a valid whole-rupee amount.";
  if (amount < minimum) return `Enter at least ₹${minimum.toLocaleString("en-IN")}.`;
  if (amount > maximum) return `Enter no more than ₹${maximum.toLocaleString("en-IN")}.`;
  return "";
}

export function updateDonationAmountValidity(input: HTMLInputElement, minimum: number, maximum: number): void {
  input.setCustomValidity(donationAmountValidationMessage(input.value, minimum, maximum));
}

/** Return only amounts accepted by the server's whole-INR order contract.
 * Fractional balances below ₹10 cannot be paid and are not rounded up. */
export function getWholeRupeeCheckoutRange(remaining: number): { minimum: number; maximum: number } | null {
  if (!Number.isFinite(remaining) || remaining <= 0 ||
      (remaining < 10 && !Number.isInteger(remaining))) return null;
  const maximum = Math.min(1_000_000, Math.floor(remaining));
  if (!Number.isSafeInteger(maximum) || maximum < 1) return null;
  return { minimum: maximum < 10 ? maximum : 10, maximum };
}

/**
 * Optional shortcuts are derived from the same current payable range used by
 * the checkout. They never pre-authorise a charge: the order endpoint must
 * validate the selected amount and appeal again on submission.
 */
export function getDonationAmountPresets(remaining: number): number[] {
  const range = getWholeRupeeCheckoutRange(remaining);
  if (!range) return [];
  const presets = [500, 1_000, 2_500].filter(amount => amount <= range.maximum);
  if (range.maximum <= 5_000 && !presets.includes(range.maximum)) {
    presets.push(range.maximum);
  }
  return presets;
}

/** Encode only a validated whole-INR amount in a verified UPI destination.
 * The donor still confirms payment in their app and reports the UTR. */
export function getUpiPaymentUri(
  upiId: string,
  amountText: string,
  minimum: number,
  maximum: number,
): string | null {
  if (!Number.isSafeInteger(minimum) || minimum < 1 ||
      !Number.isFinite(maximum) || maximum < minimum || maximum > 1_000_000) return null;
  if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(upiId) ||
      !amountText || donationAmountValidationMessage(amountText, minimum, maximum)) return null;
  const amount = Number(amountText);
  if (!Number.isSafeInteger(amount)) return null;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("AMAANA FOUNDATION")}&am=${amount.toFixed(2)}&cu=INR`;
}
