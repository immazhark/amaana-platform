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
