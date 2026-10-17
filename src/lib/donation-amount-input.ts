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

/** Derive the exact pay-able whole-rupee interval from a reviewed balance.
 * A sub-₹10 remainder is accepted by the server only when the ENTIRE
 * remaining balance is a whole number. Do not advertise a checkout for
 * ₹9.50 or ₹0.50 that the server will necessarily reject. */
export function getWholeRupeeCheckoutRange(remaining: number): { minimum: number; maximum: number } | null {
  if (!Number.isFinite(remaining) || remaining <= 0 ||
      (remaining < 10 && !Number.isInteger(remaining))) return null;
  const maximum = Math.min(1_000_000, Math.floor(remaining));
  if (!Number.isSafeInteger(maximum) || maximum < 1) return null;
  return { minimum: maximum < 10 ? maximum : 10, maximum };
}
