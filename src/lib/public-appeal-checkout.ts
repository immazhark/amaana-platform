import { isAppealOpenForDonations, type AppealFundraisingState } from "@/lib/appeals";
import { getPublicAppealProgress } from "@/lib/public-appeal-progress";
import { getWholeRupeeCheckoutRange } from "@/lib/donation-amount-input";

/**
 * One read-only public checkout eligibility gate for appeals index, detail,
 * donation landing and direct donor pages. The payment API must independently
 * revalidate live status, amount and permissions at submission time.
 */
export function getPublicAppealCheckoutEligibility(
  appeal: AppealFundraisingState,
  now: Date = new Date(),
) {
  if (!isAppealOpenForDonations(appeal, now)) return null;
  const progress = getPublicAppealProgress(appeal.amountRaised, appeal.goalAmount);
  if (!progress) return null;
  const range = getWholeRupeeCheckoutRange(progress.remaining);
  return range ? { progress, range } : null;
}
