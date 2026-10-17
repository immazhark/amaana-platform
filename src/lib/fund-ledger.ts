/** Internal accounting projection for approved giving-fund donations.
 * Never count pending claims or unverified orders as money received.
 * Pass only persisted donation rows; caller must filter by fund ID as well.
 */
type MoneyDecimal = { mul(multiplier: number): { toNumber(): number } };

export type FundLedgerDonation = {
  id: string;
  appealId: string | null;
  fundId: string | null;
  currency: string;
  status: string;
  amount: MoneyDecimal;
  refundedAmount: MoneyDecimal;
};

export type FundLedgerTotals = {
  grossCapturedPaise: number;
  refundedPaise: number;
  netRetainedPaise: number;
  settledDonations: number;
  unsettledDonations: number;
};

function checkedPaise(amount: MoneyDecimal, name: string) {
  const value = amount.mul(100).toNumber();
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Invalid ${name} monetary value`);
  }
  return value;
}

function checkedAdd(left: number, right: number) {
  const value = left + right;
  if (!Number.isSafeInteger(value)) throw new RangeError("Giving fund ledger exceeds safe integer accounting limits");
  return value;
}

export function summarizeFundLedger(fundId: string, donations: readonly FundLedgerDonation[]): FundLedgerTotals {
  if (!fundId) throw new Error("Giving fund is required");
  let grossCapturedPaise = 0;
  let refundedPaise = 0;
  let settledDonations = 0;
  let unsettledDonations = 0;
  const seen = new Set<string>();

  for (const donation of donations) {
    if (!donation.id || seen.has(donation.id)) throw new Error("Duplicate or missing donation in fund ledger");
    seen.add(donation.id);
    if (donation.fundId !== fundId || donation.appealId !== null || donation.currency !== "INR") {
      throw new Error("Donation is not exclusively designated to this domestic giving fund");
    }
    const accounting = summarizeDonationRecord(donation);
    if (donation.status === "CAPTURED" || donation.status === "REFUNDED") {
      grossCapturedPaise = checkedAdd(grossCapturedPaise, accounting.amountPaise);
      refundedPaise = checkedAdd(refundedPaise, accounting.refundedPaise);
      settledDonations++;
    } else {
      unsettledDonations++;
    }
  }

  return {
    grossCapturedPaise,
    refundedPaise,
    netRetainedPaise: grossCapturedPaise - refundedPaise,
    settledDonations,
    unsettledDonations,
  };
}

/** Aggregated settled rows must retain the same paise precision as individual
 * donations. Never display rounded or unsafe monetary data as a valid balance.
 */
export function summarizeSettledDonationAggregate(input: {
  amount: MoneyDecimal | null;
  refundedAmount: MoneyDecimal | null;
  settledDonations: number;
}) {
  if (!Number.isSafeInteger(input.settledDonations) || input.settledDonations < 0) {
    throw new Error("Invalid settled donation count");
  }
  if (input.settledDonations === 0 && input.amount === null && input.refundedAmount === null) {
    return { grossCapturedPaise: 0, refundedPaise: 0, netRetainedPaise: 0, settledDonations: 0 };
  }
  if (input.settledDonations === 0 ||
      input.amount === null || input.refundedAmount === null) {
    throw new Error("Invalid settled donation aggregate");
  }
  const grossCapturedPaise = checkedPaise(input.amount, "captured aggregate");
  const refundedPaise = checkedPaise(input.refundedAmount, "refund aggregate");
  if (grossCapturedPaise <= 0 || refundedPaise > grossCapturedPaise) {
    throw new Error("Donation aggregate accounting is inconsistent");
  }
  return { grossCapturedPaise, refundedPaise,
    netRetainedPaise: grossCapturedPaise - refundedPaise,
    settledDonations: input.settledDonations };
}

/** Private record projection: a submitted claim is not money retained. */
export function summarizeDonationRecord(input: {
  currency: string; status: string; amount: MoneyDecimal; refundedAmount: MoneyDecimal;
}) {
  if (input.currency !== "INR") throw new Error("Unsupported donation currency");
  const amountPaise = checkedPaise(input.amount, "donation amount");
  const refundedPaise = checkedPaise(input.refundedAmount, "refunded amount");
  if (amountPaise <= 0 || refundedPaise > amountPaise) throw new Error("Inconsistent donation accounting");
  const settled = input.status === "CAPTURED" || input.status === "REFUNDED";
  if (input.status === "REFUNDED" && refundedPaise !== amountPaise) throw new Error("Incomplete full refund accounting");
  if (input.status === "CAPTURED" && refundedPaise === amountPaise) {
    throw new Error("Fully refunded donation must have REFUNDED status");
  }
  if (!settled && (!["CREATED", "AUTHORIZED", "PENDING_VERIFICATION", "FAILED", "REJECTED"].includes(input.status) || refundedPaise !== 0)) {
    throw new Error("Invalid unsettled donation accounting");
  }
  return { amountPaise, refundedPaise, netRetainedPaise: settled ? amountPaise - refundedPaise : 0 };
}
