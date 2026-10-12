/**
 * Parses a positive Indian rupee amount from an administrative form.
 * Only ordinary decimal notation is accepted: no exponent notation,
 * signs, grouping commas or more than two fractional digits.
 *
 * This check is server-side. Browser patterns improve UX but are bypassable.
 */
export function parsePositiveRupeeAmount(
  value: string,
  field: string,
  options?: { optional?: false },
): number;
export function parsePositiveRupeeAmount(
  value: string,
  field: string,
  options: { optional: true },
): number | null;
export function parsePositiveRupeeAmount(
  value: string,
  field: string,
  options: { optional?: boolean } = {},
): number | null {
  const raw = value.trim();
  if (!raw && options.optional) return null;
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$/.test(raw)) {
    throw new Error(`${field} must be a positive rupee amount with no more than two decimal places`);
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000) {
    throw new Error(`${field} must be a positive amount no greater than ₹10,000,000,000`);
  }
  return amount;
}
