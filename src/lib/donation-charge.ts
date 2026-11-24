type Money = { mul: (factor: number) => { toNumber: () => number } };

// What the gateway actually charged the donor: the chosen donation plus any covered processing fee.
// Records created before fee cover existed (or tests without the field) have no fee and behave as before.
export function donationChargePaise(donation: { amount: Money; feeContributionAmount?: Money | null }): number {
  const amountPaise = donation.amount.mul(100).toNumber();
  const feePaise = donation.feeContributionAmount ? donation.feeContributionAmount.mul(100).toNumber() : 0;
  return amountPaise + feePaise;
}

export function feeContributionPaise(donation: { feeContributionAmount?: Money | null }): number {
  return donation.feeContributionAmount ? donation.feeContributionAmount.mul(100).toNumber() : 0;
}
