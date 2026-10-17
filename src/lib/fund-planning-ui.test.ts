import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("permission-scoped giving fund planning summary", () => {
  const page = readFileSync(new URL("../app/admin/(protected)/giving-funds/page.tsx", import.meta.url), "utf8");
  it("requires donation read permission and rollout approval before querying finance allocations", () => {
    expect(page).toContain('hasPermission(user, "donation.view")');
    expect(page).toContain("canViewDonations && allocationPlanningEnabled()");
    expect(page).toContain("showPlanning && fundsWithReadPermission.length");
    expect(page).toContain("summarizeFundPlanning");
  });
  it("aggregates all active approvals by fund without truncating individual proposals", () => {
    expect(page).toContain("prisma.donationAllocationProposal.groupBy");
    expect(page).toContain('by: ["fundId"]');
    expect(page).toContain('status: "APPROVED", reversal: { is: null }');
    expect(page).toContain("_sum: { amountPaise: true }");
    expect(page).toContain('OR: [{ status: { not: "CAPTURED" } }, { refundedAmount: { gt: 0 } }]');
    expect(page).toContain("refundConflictApprovals: refundConflicts.get(fund.id)");
  });
  it("never presents planning as settled expenditure, cash in bank or public impact", () => {
    expect(page).toContain("not bank cash, paid expenses or beneficiary outcomes");
    expect(page).toContain("Do not infer an available balance");
    expect(page).toContain('<Link href="/admin/allocations">Review proposals and conflicts</Link>');
  });
});
