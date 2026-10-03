export type RefundAccountingInput = {
  donationAmountPaise: number;
  refundedAmountPaise: number;
  appealRaisedPaise: number;
  requestedRefundPaise: number;
};

export type RefundAccountingResult = {
  donationRefundPaise: number;
  appealRefundPaise: number;
  nextRefundedAmountPaise: number;
  nextAppealRaisedPaise: number;
  fullyRefunded: boolean;
  wasCapped: boolean;
};

function assertNonNegativeSafeInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

/**
 * Calculates the local accounting effect of a verified provider refund.
 *
 * Provider truth is recorded separately in PaymentEvent. Local financial totals
 * are bounded so a duplicate, inconsistent or over-refund event can never make
 * Donation.refundedAmount exceed Donation.amount or make Appeal.amountRaised
 * negative.
 */
export function calculateRefundAccounting(input: RefundAccountingInput): RefundAccountingResult {
  assertNonNegativeSafeInteger(input.donationAmountPaise, "donationAmountPaise");
  assertNonNegativeSafeInteger(input.refundedAmountPaise, "refundedAmountPaise");
  assertNonNegativeSafeInteger(input.appealRaisedPaise, "appealRaisedPaise");
  assertNonNegativeSafeInteger(input.requestedRefundPaise, "requestedRefundPaise");

  const boundedRefundedAmountPaise = Math.min(
    input.refundedAmountPaise,
    input.donationAmountPaise,
  );
  const remainingDonationPaise = input.donationAmountPaise - boundedRefundedAmountPaise;
  const donationRefundPaise = Math.min(input.requestedRefundPaise, remainingDonationPaise);
  const appealRefundPaise = Math.min(donationRefundPaise, input.appealRaisedPaise);
  const nextRefundedAmountPaise = boundedRefundedAmountPaise + donationRefundPaise;
  const nextAppealRaisedPaise = input.appealRaisedPaise - appealRefundPaise;

  return {
    donationRefundPaise,
    appealRefundPaise,
    nextRefundedAmountPaise,
    nextAppealRaisedPaise,
    fullyRefunded:
      input.donationAmountPaise > 0 &&
      nextRefundedAmountPaise >= input.donationAmountPaise,
    wasCapped:
      donationRefundPaise !== input.requestedRefundPaise ||
      appealRefundPaise !== donationRefundPaise,
  };
}
