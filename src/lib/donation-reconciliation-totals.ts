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
