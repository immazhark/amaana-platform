import { describe, expect, it } from "vitest";
import { calculateRefundAccounting } from "./refund-accounting";

describe("calculateRefundAccounting", () => {
  it("applies a normal partial refund to both donation and appeal totals", () => {
    expect(
      calculateRefundAccounting({
        donationAmountPaise: 10_000,
        refundedAmountPaise: 2_000,
        appealRaisedPaise: 50_000,
        requestedRefundPaise: 3_000,
      }),
    ).toEqual({
      donationRefundPaise: 3_000,
      appealRefundPaise: 3_000,
      nextRefundedAmountPaise: 5_000,
      nextAppealRaisedPaise: 47_000,
      fullyRefunded: false,
      wasCapped: false,
    });
  });

  it("caps an over-refund at the donation's remaining refundable amount", () => {
    const result = calculateRefundAccounting({
      donationAmountPaise: 10_000,
      refundedAmountPaise: 8_000,
      appealRaisedPaise: 50_000,
      requestedRefundPaise: 5_000,
    });

    expect(result.donationRefundPaise).toBe(2_000);
    expect(result.nextRefundedAmountPaise).toBe(10_000);
    expect(result.fullyRefunded).toBe(true);
    expect(result.wasCapped).toBe(true);
  });

  it("never drives appeal amount raised below zero", () => {
    const result = calculateRefundAccounting({
      donationAmountPaise: 10_000,
      refundedAmountPaise: 0,
      appealRaisedPaise: 1_500,
      requestedRefundPaise: 4_000,
    });

    expect(result.donationRefundPaise).toBe(4_000);
    expect(result.appealRefundPaise).toBe(1_500);
    expect(result.nextAppealRaisedPaise).toBe(0);
    expect(result.wasCapped).toBe(true);
  });

  it("turns a duplicate refund after full refund into a no-op", () => {
    const result = calculateRefundAccounting({
      donationAmountPaise: 10_000,
      refundedAmountPaise: 10_000,
      appealRaisedPaise: 40_000,
      requestedRefundPaise: 2_000,
    });

    expect(result.donationRefundPaise).toBe(0);
    expect(result.appealRefundPaise).toBe(0);
    expect(result.nextRefundedAmountPaise).toBe(10_000);
    expect(result.nextAppealRaisedPaise).toBe(40_000);
    expect(result.fullyRefunded).toBe(true);
    expect(result.wasCapped).toBe(true);
  });

  it("rejects unsafe or negative paise inputs", () => {
    expect(() =>
      calculateRefundAccounting({
        donationAmountPaise: 10_000,
        refundedAmountPaise: -1,
        appealRaisedPaise: 10_000,
        requestedRefundPaise: 100,
      }),
    ).toThrow(RangeError);

    expect(() =>
      calculateRefundAccounting({
        donationAmountPaise: Number.MAX_SAFE_INTEGER + 1,
        refundedAmountPaise: 0,
        appealRaisedPaise: 10_000,
        requestedRefundPaise: 100,
      }),
    ).toThrow(RangeError);
  });
});
