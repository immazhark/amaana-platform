import "server-only";
import { prisma } from "@/lib/prisma";
import { approvedFundDesignationSnapshot, FundValidationError } from "@/lib/giving-funds";
import { fundCheckoutIds } from "@/lib/fund-checkout-policy";
import type { DonorFund } from "@/lib/fund-checkout-contract";

/** Approved disclosure only; private governance and accounting never leave here. */
export async function getDonorFundChoices(): Promise<DonorFund[]> {
  const ids = fundCheckoutIds();
  if (!ids.length) return [];
  const records = await prisma.givingFund.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    orderBy: [{ name: "asc" }, { id: "asc" }], take: 100,
    select: { id: true, slug: true, name: true, purpose: true, disclosure: true,
      accountCode: true, acceptedIntents: true, currency: true, status: true, revision: true,
      createdById: true, lastEditedById: true, approvedById: true, approvedAt: true },
  });
  return records.flatMap(fund => {
    try {
      const intent = fund.acceptedIntents[0];
      if (!intent) return [];
      const snapshot = approvedFundDesignationSnapshot(fund, fund.revision, intent);
      return [{ id: fund.id, revision: fund.revision, name: snapshot.label,
        purpose: snapshot.purpose, disclosure: snapshot.disclosure,
        acceptedIntents: fund.acceptedIntents as DonorFund["acceptedIntents"] }];
    } catch (error) {
      if (error instanceof FundValidationError) return [];
      throw error;
    }
  });
}
