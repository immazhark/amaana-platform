import type { Prisma } from "@prisma/client";

/**
 * Read-only totals of charitable principal, in INR. Provider refunds include any
 * returned fee contribution, which is not part of the gift. Apply the existing
 * fee-first rule to each captured/refunded row before summing, in one snapshot.
 * No donor details, payment identifiers or individual amounts leave the query.
 */
export async function loadDonationReconciliationTotals(client: Pick<Prisma.TransactionClient, "$queryRaw">) {
  const [totals] = await client.$queryRaw<{
    grossCaptured: Prisma.Decimal;
    refunded: Prisma.Decimal;
    netRetained: Prisma.Decimal;
  }[]>`
    WITH totals AS (
      SELECT COALESCE(SUM("amount"), 0) AS "grossCaptured",
             COALESCE(SUM(GREATEST("refundedAmount" - "feeContributionAmount", 0)), 0) AS "refunded"
      FROM "Donation"
      WHERE "status" IN ('CAPTURED', 'REFUNDED')
    )
    SELECT "grossCaptured", "refunded",
           GREATEST("grossCaptured" - "refunded", 0) AS "netRetained"
    FROM totals
  `;
  if (!totals) throw new Error("Donation reconciliation totals unavailable");
  return {
    grossCaptured: totals.grossCaptured.toNumber(),
    refunded: totals.refunded.toNumber(),
    netRetained: totals.netRetained.toNumber(),
  };
}

const reportINR = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2,
});
export const formatDonationReportINR = (amount: number) => reportINR.format(amount);

type Money = { toNumber: () => number };

/** The same fee-first principal rule for a single private record. Pending and
 * unsuccessful attempts are never retained donations. Use integer paise. */
export function donationRecordAmounts(donation: {
  status: string; amount: Money; feeContributionAmount: Money; refundedAmount: Money;
}) {
  const paise = (money: Money) => Math.round(money.toNumber() * 100);
  const gift = paise(donation.amount);
  const fee = paise(donation.feeContributionAmount);
  const returned = paise(donation.refundedAmount);
  const refunded = Math.max(0, returned - fee);
  const verified = donation.status === "CAPTURED" || donation.status === "REFUNDED";
  return {
    amount: gift / 100,
    coveredFee: fee / 100,
    totalReturned: returned / 100,
    donationRefunded: refunded / 100,
    netRetained: verified ? Math.max(0, gift - refunded) / 100 : 0,
  };
}
