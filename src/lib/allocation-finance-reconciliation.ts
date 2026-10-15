import { summarizeDonationRecord } from "@/lib/fund-ledger";

type Decimal = { mul(n: number): { toNumber(): number } };
export type AllocationSourceBalance = {
  currency: string; status: string; amount: Decimal; refundedAmount: Decimal;
};
export type AllocationBalanceHealth =
  | { state: "CLEAR"; activeApprovedPaise: number; retainedPaise: number; remainingPaise: number }
  | { state: "REFUND_CONFLICT" | "OVERALLOCATED" | "INVALID_SOURCE"; activeApprovedPaise: number; retainedPaise: number | null; remainingPaise: null };

/** Read-only projection for finance staff, never public impact or bank cash.
 * Reversals cancel historical allocation planning only, not payments. */
export function assessAllocationBalance(source: AllocationSourceBalance, approved: readonly {
  amountPaise: number; reversed: boolean;
}[]): AllocationBalanceHealth {
  let assigned = 0;
  for (const row of approved) {
    if (!Number.isSafeInteger(row.amountPaise) || row.amountPaise <= 0 ||
        typeof row.reversed !== "boolean") {
      return { state: "INVALID_SOURCE", activeApprovedPaise: assigned, retainedPaise: null, remainingPaise: null };
    }
    if (!row.reversed) {
      assigned += row.amountPaise;
      if (!Number.isSafeInteger(assigned)) {
        return { state: "INVALID_SOURCE", activeApprovedPaise: assigned, retainedPaise: null, remainingPaise: null };
      }
    }
  }
  try {
    const money = summarizeDonationRecord(source);
    if (source.status !== "CAPTURED" || money.refundedPaise > 0) {
      return { state: "REFUND_CONFLICT", activeApprovedPaise: assigned,
        retainedPaise: money.netRetainedPaise, remainingPaise: null };
    }
    if (assigned > money.netRetainedPaise) {
      return { state: "OVERALLOCATED", activeApprovedPaise: assigned,
        retainedPaise: money.netRetainedPaise, remainingPaise: null };
    }
    return { state: "CLEAR", activeApprovedPaise: assigned,
      retainedPaise: money.netRetainedPaise, remainingPaise: money.netRetainedPaise - assigned };
  } catch {
    return { state: "INVALID_SOURCE", activeApprovedPaise: assigned,
      retainedPaise: null, remainingPaise: null };
  }
}
