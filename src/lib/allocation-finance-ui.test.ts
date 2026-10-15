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
    expect(ledger).toContain('item.donation.refundedAmount.toNumber() > 0');
    expect(ledger).toContain('item.donation.status !== "CAPTURED"');
    expect(ledger).toContain("this screen does not issue a refund or alter the original approval");
    expect(ledger).toContain('item.createdBy.id !== staff.id && item.reviewedBy?.id !== staff.id');
  });
});
