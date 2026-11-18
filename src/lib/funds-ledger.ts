import { prisma } from "@/lib/prisma";
import { summariseFunds, type DisbursementLedgerRow, type DonationLedgerRow } from "@/lib/giving-funds";

type DecimalLike = { mul: (n: number) => { toNumber: () => number } };
const toPaise = (rupees: DecimalLike | null) => (rupees ? Math.round(rupees.mul(100).toNumber()) : 0);

// Per-fund and total-Zakat account from verified, refunded, pending and disbursement records only.
export async function getFundsLedger() {
  const [funds, donationGroups, disbursementGroups] = await Promise.all([
    prisma.fund.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true, status: true, zakatPolicy: true } }),
    prisma.donation.groupBy({
      by: ["fundId", "givingIntent", "status"],
      where: { status: { in: ["CAPTURED", "REFUNDED", "PENDING_VERIFICATION"] } },
      _sum: { amount: true, refundedAmount: true, feeContributionAmount: true },
    }),
    prisma.fundDisbursement.groupBy({
      by: ["fundId", "pool", "status"],
      where: { status: { in: ["DRAFT", "PUBLISHED"] } },
      _sum: { amount: true },
    }),
  ]);
  const donations: DonationLedgerRow[] = donationGroups.map(group => ({
    fundId: group.fundId,
    givingIntent: group.givingIntent,
    status: group.status,
    amountPaise: toPaise(group._sum.amount),
    refundedPaise: toPaise(group._sum.refundedAmount),
    feePaise: toPaise(group._sum.feeContributionAmount),
  }));
  const disbursements: DisbursementLedgerRow[] = disbursementGroups.map(group => ({
    fundId: group.fundId,
    pool: group.pool,
    status: group.status,
    amountPaise: toPaise(group._sum.amount),
  }));
  return { funds, ...summariseFunds(donations, disbursements) };
}
