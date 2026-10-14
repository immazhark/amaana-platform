import { amountToNumber, getAppealProgressPercent, type AmountLike } from "@/lib/appeals";
import { formatPrivateReceiptINR } from "@/lib/private-donation-ack";

export type PublicAppealProgress = {
  raised: number;
  goal: number;
  remaining: number;
  raisedLabel: string;
  goalLabel: string;
  remainingLabel: string;
  percentage: number;
};

function toPaise(input: AmountLike): number | null {
  const value = amountToNumber(input);
  if (!Number.isFinite(value) || value < 0) return null;
  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise) ||
    Math.abs(value - paise / 100) > Number.EPSILON * Math.max(1, value) * 2) return null;
  return paise;
}

/** Single, fail-closed two-decimal public fundraising projection.
 * A malformed ledger must never be silently rounded into a persuasive
 * fundraising number or an actionable checkout amount. */
export function getPublicAppealProgress(
  amountRaised: AmountLike, goalAmount: AmountLike,
): PublicAppealProgress | null {
  const raisedPaise = toPaise(amountRaised);
  const goalPaise = toPaise(goalAmount);
  if (raisedPaise === null || goalPaise === null || goalPaise <= 0) return null;
  const remainderPaise = Math.max(0, goalPaise - raisedPaise);
  const raised = raisedPaise / 100;
  const goal = goalPaise / 100;
  const remaining = remainderPaise / 100;
  return {
    raised, goal, remaining,
    raisedLabel: formatPrivateReceiptINR(raised),
    goalLabel: formatPrivateReceiptINR(goal),
    remainingLabel: formatPrivateReceiptINR(remaining),
    percentage: getAppealProgressPercent(raised, goal),
  };
}
