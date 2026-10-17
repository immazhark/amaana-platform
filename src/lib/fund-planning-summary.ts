/** Fund-level planning is advisory bookkeeping, not bank cash or expenses.
 * Only *approved, un-reversed* internal allocations are counted; pending
 * proposals cannot reserve money. Conflict counts require finance review.
 */
export type FundPlanningSummary =
  | { state: "CLEAR"; approvedPaise: number; remainingUnplannedPaise: number; activeApprovals: number }
  | { state: "REVIEW_REQUIRED"; approvedPaise: number | null; remainingUnplannedPaise: null;
      activeApprovals: number; reason: "REFUND_CONFLICT" | "OVERALLOCATED" | "INVALID_AGGREGATE" };

export function summarizeFundPlanning(input: {
  netRetainedPaise: number;
  approvedPaise: number | null;
  activeApprovals: number;
  refundConflictApprovals: number;
}): FundPlanningSummary {
  const { netRetainedPaise, approvedPaise, activeApprovals, refundConflictApprovals } = input;
  const validCount = (value: number) => Number.isSafeInteger(value) && value >= 0;
  if (!validCount(netRetainedPaise) || !validCount(activeApprovals) ||
      !validCount(refundConflictApprovals) || refundConflictApprovals > activeApprovals ||
      (approvedPaise !== null && !validCount(approvedPaise)) ||
      (activeApprovals === 0 && approvedPaise !== null && approvedPaise !== 0) ||
      (activeApprovals > 0 && (approvedPaise === null || approvedPaise < activeApprovals))) {
    return { state: "REVIEW_REQUIRED", approvedPaise: null, remainingUnplannedPaise: null,
      activeApprovals: validCount(activeApprovals) ? activeApprovals : 0, reason: "INVALID_AGGREGATE" };
  }
  const assigned = approvedPaise ?? 0;
  if (refundConflictApprovals > 0) {
    return { state: "REVIEW_REQUIRED", approvedPaise: assigned, remainingUnplannedPaise: null,
      activeApprovals, reason: "REFUND_CONFLICT" };
  }
  if (assigned > netRetainedPaise) {
    return { state: "REVIEW_REQUIRED", approvedPaise: assigned, remainingUnplannedPaise: null,
      activeApprovals, reason: "OVERALLOCATED" };
  }
  return { state: "CLEAR", approvedPaise: assigned,
    remainingUnplannedPaise: netRetainedPaise - assigned, activeApprovals };
}
