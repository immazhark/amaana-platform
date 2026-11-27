export type SponsorshipExportRow = {
  programme: string; monthlyRate: number; rateVersion: string;
  verifiedCount: number; grossCaptured: number; principalRefunded: number; netRetained: number;
  pendingCount: number; pendingAmount: number; verifiedQuotedUnitMonths: number;
  retainedWholeUnitMonths: number; retainedRemainder: number; pendingQuotedUnitMonths: number;
};

const csvText = (value: string) => `"${(/^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_DISPLAY_PAISE = BigInt(2 ** 45) * 100n - 1n;
function count(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid sponsorship count");
  return BigInt(value);
}
function paise(value: number): bigint {
  // Conservative bound: preserve cent precision through Number conversion and scaling.
  const cents = Math.round(value * 100);
  if (!Number.isFinite(value) || value < 0 || value >= 2 ** 45 || !Number.isSafeInteger(cents) || cents / 100 !== value) throw new Error("Invalid sponsorship amount");
  return BigInt(cents);
}
const money = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;

/** Validate and export the same aggregate cohorts shown on the private review page.
 * Control totals do not add rate equivalents across historical rates or programmes. */
export function summarizeTaleemSponsorship(scope: string, rows: readonly SponsorshipExportRow[]) {
  if (scope !== "all") {
    const match = /^(\d{4})-(\d{2})$/.exec(scope);
    if (!match || (Number(match[1]) + 1) % 100 !== Number(match[2])) throw new Error("Invalid sponsorship scope");
  }
  const totals = { verifiedCount: 0n, grossPaise: 0n, refundedPaise: 0n, retainedPaise: 0n, pendingCount: 0n, pendingPaise: 0n };
  const seen = new Set<string>();
  const lines = ["reporting_scope,programme,monthly_rate_inr,rate_version,verified_count,gross_verified_inr,cumulative_principal_refunded_inr,retained_principal_inr,pending_claim_count,pending_claim_amount_inr,verified_quoted_unit_months,retained_whole_rate_equivalents,retained_remainder_inr,pending_quoted_unit_months"];
  for (const row of rows) {
    const rate = paise(row.monthlyRate), gross = paise(row.grossCaptured), refund = paise(row.principalRefunded), retained = paise(row.netRetained), pending = paise(row.pendingAmount), remainder = paise(row.retainedRemainder);
    const verifiedCount = count(row.verifiedCount), pendingCount = count(row.pendingCount), verifiedMonths = count(row.verifiedQuotedUnitMonths), pendingMonths = count(row.pendingQuotedUnitMonths), whole = count(row.retainedWholeUnitMonths);
    if (typeof row.programme !== "string" || !row.programme || typeof row.rateVersion !== "string" || !row.rateVersion || rate === 0n || gross - refund !== retained || retained / rate !== whole || retained % rate !== remainder) throw new Error("Inconsistent sponsorship cohort");
    const key = JSON.stringify([row.programme, rate.toString(), row.rateVersion]);
    if (seen.has(key)) throw new Error("Duplicate sponsorship cohort");
    seen.add(key);
    totals.verifiedCount += verifiedCount; totals.grossPaise += gross; totals.refundedPaise += refund; totals.retainedPaise += retained; totals.pendingCount += pendingCount; totals.pendingPaise += pending;
    lines.push([csvText(scope), csvText(row.programme), money(rate), csvText(row.rateVersion), verifiedCount, money(gross), money(refund), money(retained), pendingCount, money(pending), verifiedMonths, whole, money(remainder), pendingMonths].join(","));
  }
  if (Object.values(totals).some(value => value > MAX) || [totals.grossPaise, totals.refundedPaise, totals.retainedPaise, totals.pendingPaise].some(value => value > MAX_DISPLAY_PAISE)) throw new Error("Unsafe sponsorship control total");
  return { totals: { verifiedCount: Number(totals.verifiedCount), grossPaise: Number(totals.grossPaise), refundedPaise: Number(totals.refundedPaise), retainedPaise: Number(totals.retainedPaise), pendingCount: Number(totals.pendingCount), pendingPaise: Number(totals.pendingPaise) }, csv: lines.join("\r\n") + "\r\n" };
}
