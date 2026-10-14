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

/** Display-only percentage for accessible funding meters; never changes ledger amounts. */
export function getAppealProgressPercent(amountRaised: AmountLike, goalAmount: AmountLike): number {
  const raised = amountToNumber(amountRaised);
  const goal = amountToNumber(goalAmount);
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

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
  if (appeal.status !== "PUBLISHED") return false;
  const raised = amountToNumber(appeal.amountRaised);
  const goal = amountToNumber(appeal.goalAmount);
  const currentTime = now.getTime();

  // Never advertise a donation route when goal, receipts or clock data cannot
  // establish an open, bounded fundraising window. Zero-goal campaigns are not
  // eligible for case-linked donations.
  if (!Number.isFinite(raised) || raised < 0 || !Number.isFinite(goal) || goal <= 0) return false;
  if (!Number.isFinite(currentTime) || raised >= goal) return false;

  if (appeal.closesAt !== null && appeal.closesAt !== undefined) {
    const closeTime = new Date(appeal.closesAt).getTime();
    if (!Number.isFinite(closeTime) || closeTime <= currentTime) return false;
  }
  return true;
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

  const retained = amountToNumber(nextAmountRaised);
  const goal = amountToNumber(goalAmount);
  const currentTime = now.getTime();
  // A refund must not reopen fundraising when its financial state or clock
  // cannot be trusted. Require review rather than accepting another donation.
  if (!Number.isFinite(retained) || retained < 0 || !Number.isFinite(goal) || goal <= 0) return "CLOSED";
  if (!Number.isFinite(currentTime)) return "CLOSED";
  if (retained >= goal) return "FUNDED";
  if (closesAt !== null && closesAt !== undefined) {
    const closeTime = new Date(closesAt).getTime();
    if (!Number.isFinite(closeTime) || closeTime <= currentTime) return "CLOSED";
  }
  return "PUBLISHED";
}
