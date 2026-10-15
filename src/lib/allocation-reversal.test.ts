import { describe, expect, it } from "vitest";
import { assertAllocationReversalAllowed, parseAllocationReversalReason } from "./allocation-reversal";

const record = {
  status: "APPROVED", createdById: "finance-maker",
  reviewedById: "finance-reviewer", reversal: null,
};
describe("append-only allocation reversal policy", () => {
  it("requires a distinct authorized third reviewer", () => {
    expect(() => assertAllocationReversalAllowed(record, "independent-finance-reverser")).not.toThrow();
    expect(() => assertAllocationReversalAllowed(record, "finance-maker")).toThrow();
    expect(() => assertAllocationReversalAllowed(record, "finance-reviewer")).toThrow();
  });
  it("does not reverse pending, rejected or already reversed allocations twice", () => {
    expect(() => assertAllocationReversalAllowed({ ...record, status: "PENDING" }, "other")).toThrow();
    expect(() => assertAllocationReversalAllowed({ ...record, status: "REJECTED" }, "other")).toThrow();
    expect(() => assertAllocationReversalAllowed({ ...record, reversal: { id: "reversal1" } }, "other")).toThrow();
  });
  it("requires a bounded reason without user data", () => {
    expect(parseAllocationReversalReason("Duplicate internal allocation review")).toBe("Duplicate internal allocation review");
    expect(() => parseAllocationReversalReason("short")).toThrow();
    expect(() => parseAllocationReversalReason("X".repeat(245))).toThrow();
  });
});
