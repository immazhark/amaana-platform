import type { Prisma } from "@prisma/client";

export type SpendingParams = { fund?: string | string[]; fy?: string | string[]; pool?: string | string[]; status?: string | string[] };

/** Intersect supported filters without accepting arbitrary identifiers, repeated fields or enum values. */
export function spendingFilters(params: SpendingParams, fundIds: readonly string[], financialYears: readonly string[]): Prisma.FundDisbursementWhereInput {
  return {
    ...(typeof params.fund === "string" && fundIds.includes(params.fund) ? { fundId: params.fund } : {}),
    ...(typeof params.fy === "string" && financialYears.includes(params.fy) ? { financialYear: params.fy } : {}),
    ...(params.pool === "ZAKAT" || params.pool === "NON_ZAKAT" ? { pool: params.pool } : {}),
    ...(params.status === "DRAFT" || params.status === "PUBLISHED" || params.status === "VOID" ? { status: params.status } : {}),
  };
}

const STATUSES = ["DRAFT", "PUBLISHED", "VOID"] as const;
type Status = typeof STATUSES[number];
type Group = { status: Status; _count: { _all: number }; _sum: { amount: { toString: () => string } | null } };
type ExportScope = { fund: string; fy: string; pool: string; status: string };
// Preserve two-decimal display accuracy when converting integer paise to rupees.
const MAX_DISPLAY_PAISE = BigInt(2 ** 45) * 100n - 1n;

function exactPaise(amount: Group["_sum"]["amount"]): bigint {
  const text = amount?.toString();
  const match = typeof text === "string" ? /^(0|[1-9]\d{0,13})(?:\.(\d{1,2}))?$/.exec(text) : null;
  if (!match) throw new Error("Invalid spending aggregate amount");
  const paise = BigInt(match[1]!) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  if (paise <= 0n || paise > MAX_DISPLAY_PAISE) throw new Error("Unsafe spending aggregate amount");
  return paise;
}

function checkedSpending(groups: readonly Group[]) {
  const byStatus = new Map<Status, { count: number; paise: bigint }>();
  let count = 0n;
  for (const row of groups) {
    if (!STATUSES.includes(row.status) || byStatus.has(row.status) || !Number.isSafeInteger(row._count._all) || row._count._all <= 0) {
      throw new Error("Invalid spending aggregate group");
    }
    const paise = exactPaise(row._sum.amount);
    byStatus.set(row.status, { count: row._count._all, paise });
    count += BigInt(row._count._all);
  }
  const draft = byStatus.get("DRAFT")?.paise ?? 0n;
  const published = byStatus.get("PUBLISHED")?.paise ?? 0n;
  const voided = byStatus.get("VOID")?.paise ?? 0n;
  if (count > BigInt(Number.MAX_SAFE_INTEGER) || draft + published > MAX_DISPLAY_PAISE) throw new Error("Unsafe spending control total");
  return { byStatus, totals: { totalItems: Number(count), recordedPaise: Number(draft + published), draftPaise: Number(draft), publishedPaise: Number(published), voidPaise: Number(voided) } };
}

/** Draft and published entries reserve recorded spending; void entries remain visible but never reduce the balance. */
export function summarizeSpending(groups: readonly Group[]) {
  return checkedSpending(groups).totals;
}

const csvText = (value: string) => `"${(/^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
const money = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;

/** Aggregate export for the already-authorized filtered snapshot; no entry descriptions or identities. */
export function spendingReviewCsv(scope: ExportScope, groups: readonly Group[]) {
  const { byStatus } = checkedSpending(groups);
  if (scope.status !== "" && (!STATUSES.some(status => status === scope.status) || [...byStatus.keys()].some(status => status !== scope.status))) throw new Error("Inconsistent spending export scope");
  const prefix = [scope.fund, scope.fy, scope.pool, scope.status].map(value => csvText(value || "all"));
  const lines = ["fund_filter_id,financial_year_filter,pool_filter,status_filter,entry_status,entry_count,recorded_amount_inr,void_amount_inr"];
  for (const status of STATUSES) {
    const row = byStatus.get(status);
    if (row) lines.push([...prefix, csvText(status), row.count, money(status === "VOID" ? 0n : row.paise), money(status === "VOID" ? row.paise : 0n)].join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
