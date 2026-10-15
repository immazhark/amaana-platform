import { describe, expect, it } from "vitest";
import { summarizeFundPlanning as summarize } from "./fund-planning-summary";

describe("safe fund planning projection (not cash or verified spending)", () => {
  it("subtracts only approved non-reversed planning from settled retained donations", () => {
    expect(summarize({ netRetainedPaise: 70_000, approvedPaise: 25_000,
      activeApprovals: 2, refundConflictApprovals: 0 })).toEqual({
      state: "CLEAR", approvedPaise: 25_000, remainingUnplannedPaise: 45_000, activeApprovals: 2,
    });
  });
  it("keeps new and zero-activity funds at exact zero, without inventing receipts", () => {
    expect(summarize({ netRetainedPaise: 0, approvedPaise: null,
      activeApprovals: 0, refundConflictApprovals: 0 })).toEqual({
      state: "CLEAR", approvedPaise: 0, remainingUnplannedPaise: 0, activeApprovals: 0,
    });
  });
  it("fails closed when prior approvals are linked to later-refunded donations", () => {
    expect(summarize({ netRetainedPaise: 70_000, approvedPaise: 25_000,
      activeApprovals: 2, refundConflictApprovals: 1 })).toMatchObject({
      state: "REVIEW_REQUIRED", reason: "REFUND_CONFLICT", remainingUnplannedPaise: null,
    });
  });
  it("flags oversubscription without displaying negative planning availability", () => {
    expect(summarize({ netRetainedPaise: 20_000, approvedPaise: 25_000,
      activeApprovals: 2, refundConflictApprovals: 0 })).toMatchObject({
      state: "REVIEW_REQUIRED", reason: "OVERALLOCATED", remainingUnplannedPaise: null,
    });
  });
  it.each([
    { netRetainedPaise: -1, approvedPaise: null, activeApprovals: 0, refundConflictApprovals: 0 },
    { netRetainedPaise: 1, approvedPaise: 1.2, activeApprovals: 1, refundConflictApprovals: 0 },
    { netRetainedPaise: 1, approvedPaise: null, activeApprovals: 1, refundConflictApprovals: 0 },
    { netRetainedPaise: 100, approvedPaise: 100, activeApprovals: 0, refundConflictApprovals: 0 },
    { netRetainedPaise: 100, approvedPaise: 1, activeApprovals: 2, refundConflictApprovals: 0 },
    { netRetainedPaise: 100, approvedPaise: 20, activeApprovals: 1, refundConflictApprovals: 2 },
    { netRetainedPaise: Number.MAX_SAFE_INTEGER + 1, approvedPaise: 0, activeApprovals: 0, refundConflictApprovals: 0 },
  ])("does not present inconsistent aggregates as a valid balance: %#", row => {
    expect(summarize(row)).toMatchObject({ state: "REVIEW_REQUIRED", reason: "INVALID_AGGREGATE",
      remainingUnplannedPaise: null });
  });
});
