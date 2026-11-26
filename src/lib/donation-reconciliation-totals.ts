import type { DonationPaymentMethod, Prisma } from "@prisma/client";

type ReconciliationAmounts = {
  grossCaptured: number;
  refunded: number;
  netRetained: number;
  pendingAmount: number;
  pendingCount: number;
};
type ReconciliationRow = ReconciliationAmounts & { paymentMethod: DonationPaymentMethod | null };

/** One database snapshot for private reconciliation, grouped by payment method.
 * Captured/refunded principal excludes returned processing fees per donation.
 * Unverified direct transfer claims are separate, never included as receipts.
 * These are application records, not provider or bank settlement statements. */
export async function loadDonationReconciliationReport(client: Pick<Prisma.TransactionClient, "$queryRaw">) {
  const rows = await client.$queryRaw<{
    paymentMethod: DonationPaymentMethod | null;
    grossCaptured: Prisma.Decimal;
    refunded: Prisma.Decimal;
    netRetained: Prisma.Decimal;
    pendingAmount: Prisma.Decimal;
    pendingCount: bigint;
  }[]>`
    WITH methods AS (
      SELECT CAST("paymentMethod" AS TEXT) AS "paymentMethod",
             COALESCE(SUM("amount") FILTER (WHERE "status" IN ('CAPTURED', 'REFUNDED')), 0) AS "grossCaptured",
             COALESCE(SUM(GREATEST("refundedAmount" - "feeContributionAmount", 0)) FILTER (WHERE "status" IN ('CAPTURED', 'REFUNDED')), 0) AS "refunded",
             COALESCE(SUM("amount") FILTER (WHERE "status" = 'PENDING_VERIFICATION'), 0) AS "pendingAmount",
             COUNT(*) FILTER (WHERE "status" = 'PENDING_VERIFICATION') AS "pendingCount"
      FROM "Donation"
      WHERE "status" IN ('CAPTURED', 'REFUNDED')
         OR ("status" = 'PENDING_VERIFICATION' AND "paymentMethod" IN ('DIRECT_UPI', 'BANK_TRANSFER'))
      GROUP BY "paymentMethod"
    ), totals AS (
      SELECT CAST(NULL AS TEXT) AS "paymentMethod",
             COALESCE(SUM("grossCaptured"), 0) AS "grossCaptured",
             COALESCE(SUM("refunded"), 0) AS "refunded",
             COALESCE(SUM("pendingAmount"), 0) AS "pendingAmount",
             CAST(COALESCE(SUM("pendingCount"), 0) AS BIGINT) AS "pendingCount"
      FROM methods
    ), combined AS (
      SELECT * FROM totals UNION ALL SELECT * FROM methods
    )
    SELECT "paymentMethod", "grossCaptured", "refunded",
           GREATEST("grossCaptured" - "refunded", 0) AS "netRetained",
           "pendingAmount", "pendingCount"
    FROM combined
  `;
  const mapped: ReconciliationRow[] = rows.map(row => ({
    paymentMethod: row.paymentMethod,
    grossCaptured: row.grossCaptured.toNumber(),
    refunded: row.refunded.toNumber(),
    netRetained: row.netRetained.toNumber(),
    pendingAmount: row.pendingAmount.toNumber(),
    pendingCount: Number(row.pendingCount),
  }));
  const total = mapped.find(row => row.paymentMethod === null);
  if (!total) throw new Error("Donation reconciliation totals unavailable");
  const totals = { grossCaptured: total.grossCaptured, refunded: total.refunded, netRetained: total.netRetained, pendingAmount: total.pendingAmount, pendingCount: total.pendingCount };
  return {
    totals,
    methods: mapped.filter((row): row is ReconciliationRow & { paymentMethod: DonationPaymentMethod } => row.paymentMethod !== null),
  };
}

export async function loadDonationReconciliationTotals(client: Pick<Prisma.TransactionClient, "$queryRaw">) {
  const { totals: { grossCaptured, refunded, netRetained } } = await loadDonationReconciliationReport(client);
  return { grossCaptured, refunded, netRetained };
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
