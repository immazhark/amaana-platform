import { describe, expect, it } from "vitest";
import { assessAllocationBalance } from "./allocation-finance-reconciliation";

const money = (n: number) => ({ mul: (by: number) => ({ toNumber: () => n * by }) });
const donation = { currency: "INR", status: "CAPTURED", amount: money(500), refundedAmount: money(0) };
describe("read-only approved allocation reconciliation", () => {
  it("does not include reversed approvals in active allocated balance", () => {
    expect(assessAllocationBalance(donation, [
      { amountPaise: 12000, reversed: false }, { amountPaise: 30000, reversed: true },
    ])).toEqual({ state: "CLEAR", retainedPaise: 50000,
      activeApprovedPaise: 12000, remainingPaise: 38000 });
  });
  it("does not misrepresent a later partial/full refund as safe to allocate", () => {
    expect(assessAllocationBalance({ ...donation, refundedAmount: money(1) }, [
      { amountPaise: 10000, reversed: false },
    ])).toMatchObject({ state: "REFUND_CONFLICT", retainedPaise: 49900, remainingPaise: null });
    expect(assessAllocationBalance({ ...donation, status: "REFUNDED", refundedAmount: money(500) }, [
      { amountPaise: 10000, reversed: false },
    ])).toMatchObject({ state: "REFUND_CONFLICT", retainedPaise: 0, remainingPaise: null });
  });
  it("flags over-allocations and invalid provider-derived values without throwing", () => {
    expect(assessAllocationBalance(donation, [
      { amountPaise: 49000, reversed: false }, { amountPaise: 2000, reversed: false },
    ]).state).toBe("OVERALLOCATED");
    expect(assessAllocationBalance(donation, [{ amountPaise: -1, reversed: false }]).state).toBe("INVALID_SOURCE");
    expect(assessAllocationBalance({ ...donation, currency: "USD" }, []).state).toBe("INVALID_SOURCE");
  });
  it("preserves empty and all-reversed balances", () => {
    expect(assessAllocationBalance(donation, [])).toMatchObject({ state: "CLEAR", remainingPaise: 50000 });
    expect(assessAllocationBalance(donation, [{ amountPaise: 50000, reversed: true }])).toMatchObject({
      state: "CLEAR", remainingPaise: 50000,
    });
  });
});
