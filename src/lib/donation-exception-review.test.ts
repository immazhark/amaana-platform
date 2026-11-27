import { describe, expect, it, vi } from "vitest";
import { donationExceptionFilter, donationExceptionWhere, loadVerifiedEvidenceCounts } from "./donation-exception-review";

describe("donation exception review", () => {
  it("reuses exact counter predicates as an intersection rather than replacing status filters", () => {
    expect(donationExceptionWhere("missing-acknowledgement")).toEqual({ status: { in: ["CAPTURED", "REFUNDED"] }, receiptNumber: null });
    expect(donationExceptionWhere("missing-refund-time")).toEqual({ status: "REFUNDED", refundedAt: null });
    expect(donationExceptionWhere("missing-capture-time")).toEqual({ status: { in: ["CAPTURED", "REFUNDED"] }, capturedAt: null });
    for (const issue of ["missing-acknowledgement", "missing-refund-time", "missing-capture-time"] as const) {
      expect(donationExceptionFilter(issue)).toEqual({ issue, invalid: false, scope: { AND: [donationExceptionWhere(issue)] }, query: { issue } });
    }
  });
  it("does not change an unfiltered list", () => {
    for (const value of [undefined, ""]) expect(donationExceptionFilter(value)).toEqual({ issue: null, invalid: false, scope: {}, query: {} });
  });
  it("fails closed on unrecognized, repeated and private values without reflecting them", () => {
    for (const value of [["missing-refund-time"], ["missing-refund-time", "missing-acknowledgement"], "private@example.invalid", "constructor", "__proto__", null, 42, {}]) {
      expect(donationExceptionFilter(value)).toEqual({ issue: null, invalid: true, scope: { AND: [{ id: { in: [] } }] }, query: { issue: "invalid" } });
    }
  });
});

describe("verified donation evidence aggregate", () => {
  it("derives both missing evidence counts from the same verified population in one read", async () => {
    const aggregate = vi.fn(async () => ({ _count: { _all: 7, receiptNumber: 5, capturedAt: 4 } }));
    expect(await loadVerifiedEvidenceCounts({ donation: { aggregate } } as never)).toEqual({ missingAcknowledgements: 2, missingCaptureTimes: 3 });
    expect(aggregate).toHaveBeenCalledExactlyOnceWith({
      where: { status: { in: ["CAPTURED", "REFUNDED"] } },
      _count: { _all: true, receiptNumber: true, capturedAt: true },
    });
  });
  it("refuses inconsistent aggregate counts", async () => {
    for (const counts of [{ _all: 1, receiptNumber: 2, capturedAt: 0 }, { _all: 4, receiptNumber: 2, capturedAt: -1 }, { _all: NaN, receiptNumber: 0, capturedAt: 0 }, { _all: 1, receiptNumber: 0, capturedAt: 0.5 }]) {
      await expect(loadVerifiedEvidenceCounts({ donation: { aggregate: async () => ({ _count: counts }) } } as never)).rejects.toThrow("Inconsistent donation evidence counts");
    }
  });
});
