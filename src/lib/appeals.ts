import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";

export type AmountLike = { toNumber(): number } | number | string;

export type PublicAppeal = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  beneficiaryLocation: string | null;
  goalAmount: AmountLike;
  amountRaised: AmountLike;
  closesAt?: Date | string | null;
};

export type AppealFundraisingState = {
  status: string;
  goalAmount: AmountLike;
  amountRaised: AmountLike;
  closesAt?: Date | string | null;
};

export const amountToNumber = (amount: AmountLike) => {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") return Number(amount);
  return amount.toNumber();
};

export function getRemainingAppealAmount(
  amountRaised: AmountLike,
  goalAmount: AmountLike,
) {
  return Math.max(0, amountToNumber(goalAmount) - amountToNumber(amountRaised));
}

export function shouldMarkAppealFunded(
  status: string,
  amountRaised: AmountLike,
  goalAmount: AmountLike,
) {
  return status === "PUBLISHED" && amountToNumber(amountRaised) >= amountToNumber(goalAmount);
}

export function isAppealOpenForDonations(
  appeal: AppealFundraisingState,
  now: Date = new Date(),
) {
  // Public CTAs, donation pages and payment APIs must share one eligibility
  // boundary. A malformed or unpayable remaining amount must never render
  // an enabled donation journey only for the provider to reject it later.
  return getDonationCheckoutRemainingAmount(appeal, now) !== null;
}

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);


export function appealStatusAfterRefund(
  status: string,
  nextAmountRaised: AmountLike,
  goalAmount: AmountLike,
  closesAt?: Date | string | null,
  now: Date = new Date(),
) {
  if (status !== "FUNDED") return status;
  if (amountToNumber(nextAmountRaised) >= amountToNumber(goalAmount)) return "FUNDED";
  if (closesAt && new Date(closesAt).getTime() <= now.getTime()) return "CLOSED";
  return "PUBLISHED";
}
