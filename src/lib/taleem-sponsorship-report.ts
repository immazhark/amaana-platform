import type { Prisma } from "@prisma/client";

/** Private aggregate report from stored quotes, not the current catalogue or student inventory.
 * The fee-first refund rule is applied per record before aggregation. Unverified claims
 * are separate from verified gifts; no identities or payment credentials are selected. */
export async function loadTaleemSponsorshipReport(client: Pick<Prisma.TransactionClient, "$queryRaw">) {
  const rows = await client.$queryRaw<{
    programme: string;
    monthlyRate: Prisma.Decimal;
    rateVersion: string;
    verifiedCount: bigint;
    grossCaptured: Prisma.Decimal;
    principalRefunded: Prisma.Decimal;
    netRetained: Prisma.Decimal;
    pendingCount: bigint;
    pendingAmount: Prisma.Decimal;
    verifiedQuotedUnitMonths: bigint;
    pendingQuotedUnitMonths: bigint;
    retainedWholeUnitMonths: Prisma.Decimal;
    retainedRemainder: Prisma.Decimal;
  }[]>`
    WITH cohorts AS (
      SELECT d."sponsorshipProgramme" AS "programme",
             d."sponsorshipMonthlyRate" AS "monthlyRate",
             d."sponsorshipRateVersion" AS "rateVersion",
             COUNT(*) FILTER (WHERE d."status" IN ('CAPTURED', 'REFUNDED')) AS "verifiedCount",
             COALESCE(SUM(d."amount") FILTER (WHERE d."status" IN ('CAPTURED', 'REFUNDED')), 0) AS "grossCaptured",
             COALESCE(SUM(GREATEST(d."refundedAmount" - d."feeContributionAmount", 0)) FILTER (WHERE d."status" IN ('CAPTURED', 'REFUNDED')), 0) AS "principalRefunded",
             COUNT(*) FILTER (WHERE d."status" = 'PENDING_VERIFICATION') AS "pendingCount",
             COALESCE(SUM(d."amount") FILTER (WHERE d."status" = 'PENDING_VERIFICATION'), 0) AS "pendingAmount",
             COALESCE(SUM(d."sponsorshipUnits" * d."sponsorshipMonths") FILTER (WHERE d."status" IN ('CAPTURED', 'REFUNDED')), 0) AS "verifiedQuotedUnitMonths",
             COALESCE(SUM(d."sponsorshipUnits" * d."sponsorshipMonths") FILTER (WHERE d."status" = 'PENDING_VERIFICATION'), 0) AS "pendingQuotedUnitMonths"
      FROM "Donation" d JOIN "Fund" f ON f."id" = d."fundId"
      WHERE f."slug" = 'taleem' AND d."sponsorshipProgramme" IS NOT NULL
        AND d."status" IN ('CAPTURED', 'REFUNDED', 'PENDING_VERIFICATION')
      GROUP BY d."sponsorshipProgramme", d."sponsorshipMonthlyRate", d."sponsorshipRateVersion"
    ), retained AS (
      SELECT *, GREATEST("grossCaptured" - "principalRefunded", 0) AS "netRetained" FROM cohorts
    )
    SELECT *, DIV("netRetained", "monthlyRate") AS "retainedWholeUnitMonths",
           MOD("netRetained", "monthlyRate") AS "retainedRemainder"
    FROM retained ORDER BY "programme", "monthlyRate", "rateVersion"
  `;
  return rows.map(row => ({
    programme: row.programme,
    monthlyRate: row.monthlyRate.toNumber(),
    rateVersion: row.rateVersion,
    verifiedCount: Number(row.verifiedCount),
    grossCaptured: row.grossCaptured.toNumber(),
    principalRefunded: row.principalRefunded.toNumber(),
    netRetained: row.netRetained.toNumber(),
    pendingCount: Number(row.pendingCount),
    pendingAmount: row.pendingAmount.toNumber(),
    verifiedQuotedUnitMonths: Number(row.verifiedQuotedUnitMonths),
    pendingQuotedUnitMonths: Number(row.pendingQuotedUnitMonths),
    retainedWholeUnitMonths: row.retainedWholeUnitMonths.toNumber(),
    retainedRemainder: row.retainedRemainder.toNumber(),
  }));
}
