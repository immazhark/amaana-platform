import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("append-only reversal and maker-checker invariants", () => {
  it("retains original approval and excludes reversed proposals from balances", () => {
    const operations = readFileSync(new URL("./allocation-proposal-operations.ts", import.meta.url), "utf8");
    expect(operations).toContain("donationAllocationReversal.create");
    expect(operations).toContain("approved.filter(row => row.reversal === null)");
    expect(operations).toContain("assertAllocationReversalAllowed(proposal, input.actorId)");
    expect(operations).not.toContain("donationAllocationProposal.delete");
    expect(operations).not.toContain("razorpay");
  });
  it("requires a separate SQL-unique reversal and authorized staff review", () => {
    const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    const action = readFileSync(new URL("../app/admin/(protected)/allocations/actions.ts", import.meta.url), "utf8");
    expect(schema).toMatch(/proposalId\s+String\s+@unique/);
    expect(action).toContain('requirePermission("fund.approve")');
    expect(action).toContain("reverseAllocationProposal");
  });
});
