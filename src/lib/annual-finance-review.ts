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
type RawRow = { paymentMethod: string | null } & Omit<AnnualFinanceRow, "grossPaise" | "refundedPaise" | "retainedPaise" | "pendingPaise" | "pendingCount" | "draftPaise" | "publishedPaise"> & Record<"grossPaise" | "refundedPaise" | "retainedPaise" | "pendingPaise" | "pendingCount" | "draftPaise" | "publishedPaise", bigint>;
const safe = (value: bigint) => {
  const n = Number(value);
  if (typeof value !== "bigint" || !Number.isSafeInteger(n) || n < 0) throw new RangeError("Finance review amount outside safe integer range");
  return n;
};

const CHANNELS = ["RAZORPAY", "DIRECT_UPI", "BANK_TRANSFER"] as const;
type Channel = typeof CHANNELS[number];
export type AnnualFinanceChannel = Pick<AnnualFinanceRow, "grossPaise" | "refundedPaise" | "retainedPaise" | "pendingPaise" | "pendingCount"> & { paymentMethod: Channel };
export type AnnualFinanceCrossRow = AnnualFinanceChannel & Pick<AnnualFinanceRow, "destination" | "fundSlug" | "pool">;
const amounts = ["grossPaise", "refundedPaise", "retainedPaise", "pendingPaise", "pendingCount", "draftPaise", "publishedPaise"] as const;
type RawAmounts = Pick<RawRow, typeof amounts[number]>;
const empty = (): RawAmounts => ({ grossPaise: 0n, refundedPaise: 0n, retainedPaise: 0n, pendingPaise: 0n, pendingCount: 0n, draftPaise: 0n, publishedPaise: 0n });
function addAmounts(total: RawAmounts, row: RawAmounts) {
  for (const key of amounts) { safe(row[key]); total[key] += row[key]; }
}
function receipts(row: RawAmounts) {
  return { grossPaise: safe(row.grossPaise), refundedPaise: safe(row.refundedPaise), retainedPaise: safe(row.retainedPaise), pendingPaise: safe(row.pendingPaise), pendingCount: safe(row.pendingCount) };
}

/** One aggregate snapshot for both dimensions. Spending is never attributed to a payment channel.
 * Refunds are current cumulative principal against the capture cohort, not refund-date cash flows. */
export async function loadAnnualFinanceBreakdown(client: Pick<Prisma.TransactionClient, "$queryRaw">, period: Period): Promise<{ destinations: AnnualFinanceRow[]; channels: AnnualFinanceChannel[]; byDestinationAndChannel: AnnualFinanceCrossRow[] }> {
  const rows = await client.$queryRaw<RawRow[]>`
    WITH activity AS (
      SELECT CASE WHEN d."fundId" IS NULL THEN 'appeals' ELSE 'fund' END AS "destination",
             f."slug" AS "fundSlug", CASE WHEN d."givingIntent" = 'ZAKAT' THEN 'ZAKAT' ELSE 'NON_ZAKAT' END AS "pool",
             CAST(d."paymentMethod" AS TEXT) AS "paymentMethod",
             d."amount" AS gross, GREATEST(d."refundedAmount" - d."feeContributionAmount", 0) AS refunded,
             0 AS pending, 0 AS claims, 0 AS draft, 0 AS published
      FROM "Donation" d LEFT JOIN "Fund" f ON f."id" = d."fundId"
      WHERE d."status" IN ('CAPTURED', 'REFUNDED') AND d."capturedAt" >= ${period.start} AND d."capturedAt" < ${period.end}
      UNION ALL
      SELECT CASE WHEN d."fundId" IS NULL THEN 'appeals' ELSE 'fund' END, f."slug",
             CASE WHEN d."givingIntent" = 'ZAKAT' THEN 'ZAKAT' ELSE 'NON_ZAKAT' END,
             CAST(d."paymentMethod" AS TEXT), 0, 0, d."amount", 1, 0, 0
      FROM "Donation" d LEFT JOIN "Fund" f ON f."id" = d."fundId"
      WHERE d."status" = 'PENDING_VERIFICATION' AND d."paymentMethod" IN ('DIRECT_UPI', 'BANK_TRANSFER')
        AND d."createdAt" >= ${period.start} AND d."createdAt" < ${period.end}
      UNION ALL
      SELECT 'fund', f."slug", CAST(s."pool" AS TEXT), CAST(NULL AS TEXT), 0, 0, 0, 0,
             CASE WHEN s."status" = 'DRAFT' THEN s."amount" ELSE 0 END,
             CASE WHEN s."status" = 'PUBLISHED' THEN s."amount" ELSE 0 END
      FROM "FundDisbursement" s JOIN "Fund" f ON f."id" = s."fundId"
      WHERE s."financialYear" = ${period.label} AND s."status" IN ('DRAFT', 'PUBLISHED')
    )
    SELECT "destination", "fundSlug", "pool", "paymentMethod",
           CAST(ROUND(SUM(gross) * 100) AS BIGINT) AS "grossPaise",
           CAST(ROUND(SUM(refunded) * 100) AS BIGINT) AS "refundedPaise",
           CAST(ROUND(SUM(gross - refunded) * 100) AS BIGINT) AS "retainedPaise",
           CAST(ROUND(SUM(pending) * 100) AS BIGINT) AS "pendingPaise",
           CAST(SUM(claims) AS BIGINT) AS "pendingCount",
           CAST(ROUND(SUM(draft) * 100) AS BIGINT) AS "draftPaise",
           CAST(ROUND(SUM(published) * 100) AS BIGINT) AS "publishedPaise"
    FROM activity GROUP BY "destination", "fundSlug", "pool", "paymentMethod" ORDER BY "destination", "fundSlug", "pool", "paymentMethod"
  `;
  const destinations = new Map<string, Omit<RawRow, "paymentMethod">>();
  const channels = new Map<string, RawAmounts>();
  const byDestinationAndChannel: AnnualFinanceCrossRow[] = [];
  const seen = new Set<string>();
  const totals = empty();
  if (!Array.isArray(rows)) throw new Error("Invalid annual finance aggregate");
  for (const row of rows) {
    if (!row || (row.destination !== "appeals" && row.destination !== "fund") ||
      (row.destination === "appeals" ? row.fundSlug !== null : typeof row.fundSlug !== "string" || !row.fundSlug) ||
      (row.pool !== "ZAKAT" && row.pool !== "NON_ZAKAT")) throw new Error("Invalid annual finance aggregate identity");
    const identity = JSON.stringify([row.destination, row.fundSlug, row.pool, row.paymentMethod]);
    if (seen.has(identity)) throw new Error("Duplicate annual finance aggregate identity");
    seen.add(identity);
    addAmounts(totals, row);
    if (row.grossPaise - row.refundedPaise !== row.retainedPaise) throw new Error("Inconsistent annual finance refund totals");
    if (row.paymentMethod === null && row.destination !== "fund") throw new Error("Invalid annual finance spending destination");
    if (row.paymentMethod !== null && (row.draftPaise !== 0n || row.publishedPaise !== 0n)) throw new Error("Invalid annual finance spending channel");
    if (row.paymentMethod === "RAZORPAY" && (row.pendingPaise !== 0n || row.pendingCount !== 0n)) throw new Error("Invalid annual finance pending channel");
    const key = JSON.stringify([row.destination, row.fundSlug, row.pool]);
    let destination = destinations.get(key);
    if (!destination) {
      destination = { destination: row.destination, fundSlug: row.fundSlug, pool: row.pool, ...empty() };
      destinations.set(key, destination);
    }
    addAmounts(destination, row);
    if (row.paymentMethod === null) {
      if (row.grossPaise !== 0n || row.refundedPaise !== 0n || row.retainedPaise !== 0n || row.pendingPaise !== 0n || row.pendingCount !== 0n) throw new Error("Missing annual finance payment method");
      continue;
    }
    const paymentMethod = CHANNELS.find(method => method === row.paymentMethod);
    if (!paymentMethod) throw new Error("Unknown annual finance payment method");
    byDestinationAndChannel.push({ destination: row.destination, fundSlug: row.fundSlug, pool: row.pool, paymentMethod, ...receipts(row) });
    let channel = channels.get(row.paymentMethod);
    if (!channel) { channel = empty(); channels.set(row.paymentMethod, channel); }
    addAmounts(channel, row);
  }
  for (const field of amounts) safe(totals[field]);
  return {
    destinations: [...destinations.values()].map(row => ({ destination: row.destination, fundSlug: row.fundSlug, pool: row.pool,
      ...receipts(row), draftPaise: safe(row.draftPaise), publishedPaise: safe(row.publishedPaise) })),
    byDestinationAndChannel,
    channels: CHANNELS.flatMap(paymentMethod => {
      const row = channels.get(paymentMethod);
      return row ? [{ paymentMethod, ...receipts(row) }] : [];
    }),
  };
}

export async function loadAnnualFinanceReview(client: Pick<Prisma.TransactionClient, "$queryRaw">, period: Period): Promise<AnnualFinanceRow[]> {
  return (await loadAnnualFinanceBreakdown(client, period)).destinations;
}

// Fixed columns, no identity or free-text descriptions. Quote all text and neutralize spreadsheet formulas.
const csvText = (value: string) => `"${(/^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
const money = (paise: number) => `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
export function annualFinanceCsv(label: string, rows: readonly AnnualFinanceRow[]) {
  const header = "financial_year,destination,fund_slug,pool,capture_cohort_gross_inr,capture_cohort_cumulative_principal_refunded_inr,capture_cohort_retained_inr,pending_claims_created_inr,pending_claim_count,fund_draft_spending_inr,fund_published_spending_inr";
  return [header, ...rows.map(row => [csvText(label), csvText(row.destination), csvText(row.fundSlug ?? ""), csvText(row.pool), money(row.grossPaise), money(row.refundedPaise), money(row.retainedPaise), money(row.pendingPaise), row.pendingCount, money(row.draftPaise), money(row.publishedPaise)].join(","))].join("\r\n") + "\r\n";
}

/** Joint receipt/claim rows only. These are the same records as the two summary dimensions, not extra income. */
export function annualFinanceCrossCsv(label: string, rows: readonly AnnualFinanceCrossRow[]) {
  const header = "financial_year,destination,fund_slug,pool,payment_method,capture_cohort_gross_inr,capture_cohort_cumulative_principal_refunded_inr,capture_cohort_retained_inr,pending_claims_created_inr,pending_claim_count";
  return [header, ...rows.map(row => [csvText(label), csvText(row.destination), csvText(row.fundSlug ?? ""), csvText(row.pool), csvText(row.paymentMethod), money(row.grossPaise), money(row.refundedPaise), money(row.retainedPaise), money(row.pendingPaise), row.pendingCount].join(","))].join("\r\n") + "\r\n";
}
