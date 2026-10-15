import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/** Generated Prisma's OR clauses require mutable arrays. A deeply readonly
 * `as const` filter is incompatible with Prisma.WhereInput and can break
 * exact-head type checking even when the feature flag remains off. */
describe("Prisma query filters in finance and private donor moderation", () => {
  const read = (path: string) =>
    readFileSync(new URL(path, import.meta.url), "utf8");
  it("keeps staff queues validated against generated Prisma input types", () => {
    const source = read("../app/admin/(protected)/donations/recognition/page.tsx");
    expect(source).toContain('import type { Prisma } from "@prisma/client"');
    expect(source.match(/satisfies Prisma\.DonationWhereInput/g)).toHaveLength(3);
    expect(source).toContain("OR: [{ status: { not: \"CAPTURED\" } }, { isAnonymous: true }");
    expect(source).not.toMatch(/const ineligiblePendingWhere = \{[\s\S]*?\} as const;/);
  });
  it("retains type-safe finance relations without a readonly nested OR array", () => {
    const source = read("../app/admin/(protected)/allocations/page.tsx");
    expect(source).toContain("satisfies Prisma.DonationAllocationProposalInclude");
    expect(source).toContain("satisfies Prisma.DonationAllocationProposalWhereInput");
    expect(source).toContain('prisma.donationAllocationProposal.count({ where: refundConflictWhere })');
    expect(source).not.toMatch(/const refundConflictWhere = \{[\s\S]*?\} as const;/);
  });
});
