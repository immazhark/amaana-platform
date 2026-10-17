import { describe, expect, it } from "vitest";
import { getDonationCheckoutRemainingAmount } from "./donation-checkout-balance";

const now = new Date("2026-10-17T10:00:00.000Z");
const active = (amountRaised: number | string, goalAmount: number | string, options: Record<string, unknown> = {}) => ({
  status: "PUBLISHED",
  amountRaised, goalAmount,
  closesAt: "2026-11-30T00:00:00.000Z",
  ...options,
});

describe("strict donation checkout balance", () => {
  it("preserves two-decimal ledger precision while bounding whole-rupee payments", () => {
    expect(getDonationCheckoutRemainingAmount(active(100.3, 500.01), now)).toBe(399.71);
    expect(getDonationCheckoutRemainingAmount(active("991", "1000"), now)).toBe(9);
    expect(getDonationCheckoutRemainingAmount(active(999, 1000), now)).toBe(1);
    expect(getDonationCheckoutRemainingAmount(active(0, 10), now)).toBe(10);
  });

  it.each([
    [100.001, 1000],
    [100, 1000.001],
    [999.5, 1000],
    [999.99, 1000],
    [-1, 1000],
    [Infinity, 1000],
    [0, 0],
    [1000, 1000],
    [1001, 1000],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1],
  ])("rejects malformed, exhausted, or unpayable balances (%s / %s)", (raised, goal) => {
    expect(getDonationCheckoutRemainingAmount(active(raised, goal), now)).toBeNull();
  });

  it("fails closed for invalid status, expired or malformed closure time", () => {
    expect(getDonationCheckoutRemainingAmount(active(100, 1000, {status: "PAUSED"}), now)).toBeNull();
    expect(getDonationCheckoutRemainingAmount(active(100, 1000, {closesAt: now}), now)).toBeNull();
    expect(getDonationCheckoutRemainingAmount(active(100, 1000, {closesAt: "not-a-date"}), now)).toBeNull();
    expect(getDonationCheckoutRemainingAmount(active(100, 1000), new Date(NaN))).toBeNull();
  });

  it("never treats a large sub-paise ledger number as a legal whole-cent amount", () => {
    expect(getDonationCheckoutRemainingAmount(active("10000000000000.001", "10000000000020"), now)).toBeNull();
    expect(getDonationCheckoutRemainingAmount(active(10_000_000_000_000.002, 10_000_000_000_020), now)).toBeNull();
  });

  it("parses exact Prisma decimal strings before lossy toNumber conversion", () => {
    const raised = { toString: () => "10000000000000.001", toNumber: () => 10_000_000_000_000 };
    const goal = { toString: () => "10000000000020", toNumber: () => 10_000_000_000_020 };
    expect(getDonationCheckoutRemainingAmount({
      status: "PUBLISHED", amountRaised: raised, goalAmount: goal, closesAt: null,
    }, now)).toBeNull();
    expect(getDonationCheckoutRemainingAmount(active("100.30", "500.01"), now)).toBe(399.71);
  });

  it("supports Prisma-like decimal inputs and rejects unsafe paise conversions", () => {
    expect(getDonationCheckoutRemainingAmount({
      status: "PUBLISHED", amountRaised: {toNumber: () => 100.3},
      goalAmount: {toNumber: () => 500.01}, closesAt: null,
    }, now)).toBe(399.71);
    expect(getDonationCheckoutRemainingAmount(active(0, 100_000_000_000_000), now)).toBeNull();
  });
});
