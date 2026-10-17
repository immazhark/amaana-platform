/** Preserve verified INR paise rather than silently rounding private receipts. */
export function formatPrivateReceiptINR(amount: number): string {
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(paise)
    || Math.abs(amount - paise / 100) > Number.EPSILON * Math.max(1, amount) * 2) {
    throw new RangeError("Invalid INR amount for a private acknowledgement");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(paise / 100);
}
