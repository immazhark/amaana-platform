import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("role-limited allocation finance staff surfaces", () => {
  const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  it("only offers new proposals for approved, originally designated, nonrefunded giving fund donations", () => {
    const donor = source("../app/admin/(protected)/donations/[id]/page.tsx");
    expect(donor).toContain("allocationPlanningEnabled()");
    expect(donor).toContain('hasPermission(user, "fund.manage")');
    expect(donor).toContain('donation.fund?.status === "APPROVED"');
    expect(donor).toContain('donation.status === "CAPTURED"');
    expect(donor).toContain("accounting?.refundedPaise === 0");
    expect(donor).toContain("!designation.requiresReview");
    expect(donor).toContain('["GENERAL", "SADAQAH"].includes(donation.givingIntent)');
  });
  it("warns staff about post-approval refunds while retaining the historical approval", () => {
    const ledger = source("../app/admin/(protected)/allocations/page.tsx");
    expect(ledger).toContain('requirePermission("donation.view")');
    expect(ledger).toContain('hasPermission(staff, "fund.approve")');
    expect(ledger).toContain('assessAllocationBalance(item.donation');
    expect(ledger).toContain('health.state !== "CLEAR"');
    expect(ledger).toContain('where: { status: "PENDING" }');
    expect(ledger).toContain('where: { status: { in: ["APPROVED", "REJECTED"] } }');
    expect(ledger).toContain('take: 60');
    expect(ledger).toContain('take: 40');
    expect(ledger).toContain("Pending independent review");
    expect(ledger).toContain("Urgent refund and status reconciliation");
    expect(ledger).toContain('prisma.donationAllocationProposal.count({ where: refundConflictWhere })');
    expect(ledger).toContain('refundConflictWhere,');
    expect(ledger).toContain('reviewedAt: "asc"');
    expect(ledger).toContain('reviewedAt: "desc"');
    expect(ledger).toContain("conflictCount > conflicts.length");
    expect(ledger).toContain("conflicts.map(proposalRow)");
    expect(ledger).toContain("history.map(proposalRow)");
    expect(ledger).toContain("assessAllocationPurpose(item.donation, item, activeAmounts)");
    expect(ledger).toContain('purpose.state === "REVIEW_REQUIRED"');
    expect(ledger).toContain("Original designation review required");
    expect(ledger).toContain("Do not treat this planning approval as retained cash or verified disbursement");
    expect(ledger).toContain('item.createdBy.id !== staff.id && item.reviewedBy?.id !== staff.id');
  });
});
