import type { AmountLike, AppealFundraisingState } from "@/lib/appeals";

/** Convert trusted Prisma Decimal/string/number money to exact integer paise.
 * Reject anything that cannot be represented as a nonnegative two-decimal
 * amount; silently rounding a broken ledger could create a real payment. */
function toPaise(input: AmountLike): number | null {
  const value = typeof input === "number" ? input
    : typeof input === "string" ? Number(input)
      : input.toNumber();
  if (!Number.isFinite(value) || value < 0) return null;
  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise) ||
    Math.abs(value - paise / 100) > Number.EPSILON * Math.max(1, value) * 2) return null;
  return paise;
}

/** Server-only payment eligibility. A donor must never receive a Razorpay
 * order against malformed, fully funded, expired, or non-payable balances.
 * This independently guards the provider boundary, even when a public
 * appeal was previously presented as accepting donations. */
export function getDonationCheckoutRemainingAmount(
  appeal: AppealFundraisingState,
  now: Date = new Date(),
): number | null {
  if (appeal.status !== "PUBLISHED" || !Number.isFinite(now.getTime())) return null;

  const raisedPaise = toPaise(appeal.amountRaised);
  const goalPaise = toPaise(appeal.goalAmount);
  if (raisedPaise === null || goalPaise === null ||
    goalPaise <= 0 || raisedPaise >= goalPaise) return null;

  if (appeal.closesAt !== null && appeal.closesAt !== undefined) {
    const closesAt = new Date(appeal.closesAt).getTime();
    if (!Number.isFinite(closesAt) || closesAt <= now.getTime()) return null;
  }

  const remainingPaise = goalPaise - raisedPaise;
  // The donor API accepts only whole rupees, with an exception for the
  // exact last rupee balance under ₹10. Fractional final balances would
  // have no payable amount and must never start a provider order.
  if (remainingPaise < 1000 && remainingPaise % 100 !== 0) return null;
  return remainingPaise / 100;
}
