// Optional "cover the payment fee" add-on for gateway (Razorpay) payments. The donor's chosen amount is the
// donation; the fee is a separate, server-calculated line so the designated fund receives the full chosen gift.
// The rate is an ESTIMATE (2% gateway fee plus 18% GST on the fee = 2.36% by default) and is configurable; the
// actual fee is reconciled against the provider's own figures after capture. Never compute this in the browser.
export const DEFAULT_FEE_ESTIMATE_BPS = 236;
const MAX_FEE_BPS = 1000;

export function feeEstimateBasisPoints(raw: string | undefined = process.env.RAZORPAY_FEE_ESTIMATE_BPS): number {
  if (raw === undefined || !/^\d{1,4}$/.test(raw)) return DEFAULT_FEE_ESTIMATE_BPS;
  const value = Number(raw);
  return value >= 0 && value <= MAX_FEE_BPS ? value : DEFAULT_FEE_ESTIMATE_BPS;
}

// Smallest charge for which, after the gateway deducts bps of the charge, the fund still receives the full
// intended amount. Rounded up so a rounding gap never short-changes the fund. Integer paise throughout.
export function calculateFeeCover(intendedPaise: number, bps: number = feeEstimateBasisPoints()): { feePaise: number; totalPaise: number } {
  if (!Number.isSafeInteger(intendedPaise) || intendedPaise <= 0) throw new RangeError("Intended amount must be a positive whole number of paise");
  if (!Number.isInteger(bps) || bps < 0 || bps > MAX_FEE_BPS) throw new RangeError("Fee rate is outside the supported range");
  const denominator = 10_000n - BigInt(bps);
  const numerator = BigInt(intendedPaise) * 10_000n;
  const total = (numerator + denominator - 1n) / denominator;
  const totalPaise = Number(total);
  if (!Number.isSafeInteger(totalPaise)) throw new RangeError("Charge cannot be represented safely in paise");
  return { feePaise: totalPaise - intendedPaise, totalPaise };
}
