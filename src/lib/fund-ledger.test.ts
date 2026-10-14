import { describe, expect, it } from "vitest";
import { summarizeFundLedger, type FundLedgerDonation } from "./fund-ledger";

function rupees(value: number) {
  return { mul: (multiplier: number) => ({ toNumber: () => value * multiplier }) };
}

function donation(patch: Partial<FundLedgerDonation> = {}): FundLedgerDonation {
  return {
    id: "donation-1", fundId: "reviewed-fund", appealId: null, currency: "INR",
    status: "CAPTURED", amount: rupees(500), refundedAmount: rupees(0), ...patch,
  };
}

describe("private fund-only net accounting", () => {
  it("excludes pending transfers and only counts captured funds", () => {
    const totals = summarizeFundLedger("reviewed-fund", [
      donation(), donation({ id: "pending", status: "PENDING_VERIFICATION", amount: rupees(1000) }),
      donation({ id: "created", status: "CREATED", amount: rupees(250) }),
    ]);
    expect(totals).toEqual({
      grossCapturedPaise: 50_000, refundedPaise: 0,
      netRetainedPaise: 50_000, settledDonations: 1, unsettledDonations: 2,
    });
  });
  it("deducts partial and full refunds without double subtraction", () => {
    const totals = summarizeFundLedger("reviewed-fund", [
      donation({ refundedAmount: rupees(125) }),
      donation({ id: "fully-refunded", status: "REFUNDED", amount: rupees(200), refundedAmount: rupees(200) }),
    ]);
    expect(totals).toMatchObject({
      grossCapturedPaise: 70_000, refundedPaise: 32_500, netRetainedPaise: 37_500,
    });
  });
  it.each([
    { id: "invalid", fundId: "other" }, { id: "invalid", appealId: "another-appeal" },
    { id: "invalid", currency: "USD" }, { id: "invalid", amount: rupees(-2) },
    { id: "invalid", amount: rupees(1.234) }, { id: "invalid", refundedAmount: rupees(900) },
    { id: "invalid", status: "REFUNDED", refundedAmount: rupees(10) },
    { id: "invalid", status: "PENDING_VERIFICATION", refundedAmount: rupees(10) },
    { id: "invalid", status: "UNKNOWN" },
  ])("fails closed on invalid destination or accounting: %#", changes => {
    expect(() => summarizeFundLedger("reviewed-fund", [donation(changes)])).toThrow();
  });
  it("rejects duplicate donation identities before counting them twice", () => {
    expect(() => summarizeFundLedger("reviewed-fund", [donation(), donation()])).toThrow(/Duplicate/);
  });
  it("rejects totals that cannot be represented as safe integer paise", () => {
    expect(() => summarizeFundLedger("reviewed-fund", [
      donation({ amount: rupees((Number.MAX_SAFE_INTEGER + 1024) / 100) }),
    ])).toThrow();
  });
  it("returns zero balances for a fund with no donations", () => {
    expect(summarizeFundLedger("reviewed-fund", [])).toEqual({
      grossCapturedPaise: 0, refundedPaise: 0, netRetainedPaise: 0,
      settledDonations: 0, unsettledDonations: 0,
    });
  });
});
