import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { summariseFunds, type DisbursementLedgerRow, type DonationLedgerRow } from "@/lib/giving-funds";

type DecimalLike = { mul: (n: number) => { toNumber: () => number } };
const toPaise = (rupees: DecimalLike | null) => (rupees ? Math.round(rupees.mul(100).toNumber()) : 0);

type Client = Prisma.TransactionClient;
type Range = { start: Date; end: Date };
export type LedgerScope = { fundId?: string; capturedIn?: Range; spentIn?: Range };

const COUNTED = ["CAPTURED", "REFUNDED", "PENDING_VERIFICATION"] as const;

// Per-fund and total-Zakat account from verified, refunded, pending and disbursement records only.
// Unrefunded gifts are summed in the database; gifts with a refund are read one by one, because a refund
// returns the covered gateway fee first and that rule applies to each donation, not to an aggregate.
export async function loadFundsLedger(client: Client, scope: LedgerScope = {}) {
  const donationWhere: Prisma.DonationWhereInput = {
    status: { in: [...COUNTED] },
    ...(scope.fundId ? { fundId: scope.fundId } : {}),
    ...(scope.capturedIn ? { capturedAt: { gte: scope.capturedIn.start, lt: scope.capturedIn.end } } : {}),
  };
  const [unrefunded, refunded, disbursementGroups] = await Promise.all([
    client.donation.groupBy({
      by: ["fundId", "givingIntent", "status"],
      where: { ...donationWhere, refundedAmount: 0 },
      _sum: { amount: true },
    }),
    client.donation.findMany({
      where: { ...donationWhere, refundedAmount: { gt: 0 } },
      select: { fundId: true, givingIntent: true, status: true, amount: true, refundedAmount: true, feeContributionAmount: true },
    }),
    client.fundDisbursement.groupBy({
      by: ["fundId", "pool", "status"],
      where: {
        status: { in: ["DRAFT", "PUBLISHED"] },
        ...(scope.fundId ? { fundId: scope.fundId } : {}),
        ...(scope.spentIn ? { spentOn: { gte: scope.spentIn.start, lt: scope.spentIn.end } } : {}),
      },
      _sum: { amount: true },
    }),
  ]);
  const donations: DonationLedgerRow[] = [
    ...unrefunded.map(group => ({ fundId: group.fundId, givingIntent: group.givingIntent, status: group.status, amountPaise: toPaise(group._sum.amount), refundedPaise: 0 })),
    ...refunded.map(row => ({ fundId: row.fundId, givingIntent: row.givingIntent, status: row.status, amountPaise: toPaise(row.amount), refundedPaise: toPaise(row.refundedAmount), feePaise: toPaise(row.feeContributionAmount) })),
  ];
  const disbursements: DisbursementLedgerRow[] = disbursementGroups.map(group => ({
    fundId: group.fundId,
    pool: group.pool,
    status: group.status,
    amountPaise: toPaise(group._sum.amount),
  }));
  return summariseFunds(donations, disbursements);
}

export async function getFundsLedger() {
  const [funds, ledger] = await Promise.all([
    prisma.fund.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true, status: true, zakatPolicy: true } }),
    loadFundsLedger(prisma),
  ]);
  return { funds, ...ledger };
}
