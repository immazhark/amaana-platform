import { describe, expect, it } from "vitest";
import { donationExceptionFilter, donationExceptionWhere } from "./donation-exception-review";

describe("donation exception review", () => {
  it("reuses exact counter predicates as an intersection rather than replacing status filters", () => {
    expect(donationExceptionWhere("missing-acknowledgement")).toEqual({ status: { in: ["CAPTURED", "REFUNDED"] }, receiptNumber: null });
    expect(donationExceptionWhere("missing-refund-time")).toEqual({ status: "REFUNDED", refundedAt: null });
    for (const issue of ["missing-acknowledgement", "missing-refund-time"] as const) {
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
