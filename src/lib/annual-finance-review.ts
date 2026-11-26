import type { Prisma } from "@prisma/client";

export function financeReviewPeriod(requested: unknown, now: Date = new Date()) {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const current = ist.getUTCFullYear() - (ist.getUTCMonth() < 3 ? 1 : 0);
  const labels = Array.from({ length: Math.max(0, current - 2020 + 1) }, (_, i) => {
    const y = current - i;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  });
  const label = typeof requested === "string" && labels.includes(requested) ? requested : labels[0] ?? "2020-21";
  const year = Number(label.slice(0, 4));
  return { label, labels, start: new Date(Date.UTC(year, 3, 1) - 330 * 60_000), end: new Date(Date.UTC(year + 1, 3, 1) - 330 * 60_000) };
}

type Period = ReturnType<typeof financeReviewPeriod>;
export type AnnualFinanceRow = {
  destination: "appeals" | "fund"; fundSlug: string | null; pool: "ZAKAT" | "NON_ZAKAT";
  grossPaise: number; refundedPaise: number; retainedPaise: number; pendingPaise: number; pendingCount: number;
  draftPaise: number; publishedPaise: number;
};
type RawRow = Omit<AnnualFinanceRow, "grossPaise" | "refundedPaise" | "retainedPaise" | "pendingPaise" | "pendingCount" | "draftPaise" | "publishedPaise"> & Record<"grossPaise" | "refundedPaise" | "retainedPaise" | "pendingPaise" | "pendingCount" | "draftPaise" | "publishedPaise", bigint>;
const safe = (value: bigint) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError("Finance review amount outside safe integer range");
  return n;
};

/** One aggregate snapshot. Refunds are current cumulative principal against the capture cohort, not refund-date cash flows. */
export async function loadAnnualFinanceReview(client: Pick<Prisma.TransactionClient, "$queryRaw">, period: Period): Promise<AnnualFinanceRow[]> {
  const rows = await client.$queryRaw<RawRow[]>`
    WITH activity AS (
      SELECT CASE WHEN d."fundId" IS NULL THEN 'appeals' ELSE 'fund' END AS "destination",
             f."slug" AS "fundSlug", CASE WHEN d."givingIntent" = 'ZAKAT' THEN 'ZAKAT' ELSE 'NON_ZAKAT' END AS "pool",
             d."amount" AS gross, GREATEST(d."refundedAmount" - d."feeContributionAmount", 0) AS refunded,
             0 AS pending, 0 AS claims, 0 AS draft, 0 AS published
      FROM "Donation" d LEFT JOIN "Fund" f ON f."id" = d."fundId"
      WHERE d."status" IN ('CAPTURED', 'REFUNDED') AND d."capturedAt" >= ${period.start} AND d."capturedAt" < ${period.end}
      UNION ALL
      SELECT CASE WHEN d."fundId" IS NULL THEN 'appeals' ELSE 'fund' END, f."slug",
             CASE WHEN d."givingIntent" = 'ZAKAT' THEN 'ZAKAT' ELSE 'NON_ZAKAT' END,
             0, 0, d."amount", 1, 0, 0
      FROM "Donation" d LEFT JOIN "Fund" f ON f."id" = d."fundId"
      WHERE d."status" = 'PENDING_VERIFICATION' AND d."paymentMethod" IN ('DIRECT_UPI', 'BANK_TRANSFER')
        AND d."createdAt" >= ${period.start} AND d."createdAt" < ${period.end}
      UNION ALL
      SELECT 'fund', f."slug", CAST(s."pool" AS TEXT), 0, 0, 0, 0,
             CASE WHEN s."status" = 'DRAFT' THEN s."amount" ELSE 0 END,
             CASE WHEN s."status" = 'PUBLISHED' THEN s."amount" ELSE 0 END
      FROM "FundDisbursement" s JOIN "Fund" f ON f."id" = s."fundId"
      WHERE s."financialYear" = ${period.label} AND s."status" IN ('DRAFT', 'PUBLISHED')
    )
    SELECT "destination", "fundSlug", "pool",
           CAST(ROUND(SUM(gross) * 100) AS BIGINT) AS "grossPaise",
           CAST(ROUND(SUM(refunded) * 100) AS BIGINT) AS "refundedPaise",
           CAST(ROUND(SUM(gross - refunded) * 100) AS BIGINT) AS "retainedPaise",
           CAST(ROUND(SUM(pending) * 100) AS BIGINT) AS "pendingPaise",
           CAST(SUM(claims) AS BIGINT) AS "pendingCount",
           CAST(ROUND(SUM(draft) * 100) AS BIGINT) AS "draftPaise",
           CAST(ROUND(SUM(published) * 100) AS BIGINT) AS "publishedPaise"
    FROM activity GROUP BY "destination", "fundSlug", "pool" ORDER BY "destination", "fundSlug", "pool"
  `;
  return rows.map(row => ({ destination: row.destination, fundSlug: row.fundSlug, pool: row.pool,
    grossPaise: safe(row.grossPaise), refundedPaise: safe(row.refundedPaise), retainedPaise: safe(row.retainedPaise),
    pendingPaise: safe(row.pendingPaise), pendingCount: safe(row.pendingCount), draftPaise: safe(row.draftPaise), publishedPaise: safe(row.publishedPaise) }));
}

// Fixed columns, no identity or free-text descriptions. Quote all text and neutralize spreadsheet formulas.
const csvText = (value: string) => `"${(/^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
const money = (paise: number) => `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
export function annualFinanceCsv(label: string, rows: readonly AnnualFinanceRow[]) {
  const header = "financial_year,destination,fund_slug,pool,capture_cohort_gross_inr,capture_cohort_cumulative_principal_refunded_inr,capture_cohort_retained_inr,pending_claims_created_inr,pending_claim_count,fund_draft_spending_inr,fund_published_spending_inr";
  return [header, ...rows.map(row => [csvText(label), csvText(row.destination), csvText(row.fundSlug ?? ""), csvText(row.pool), money(row.grossPaise), money(row.refundedPaise), money(row.retainedPaise), money(row.pendingPaise), row.pendingCount, money(row.draftPaise), money(row.publishedPaise)].join(","))].join("\r\n") + "\r\n";
}
