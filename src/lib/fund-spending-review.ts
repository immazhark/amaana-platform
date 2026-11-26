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

type Group = { status: "DRAFT" | "PUBLISHED" | "VOID"; _count: { _all: number }; _sum: { amount: { toNumber: () => number } | null } };

/** Draft and published entries reserve recorded spending; void entries remain visible but never reduce the balance. */
export function summarizeSpending(groups: readonly Group[]) {
  let totalItems = 0;
  let draftPaise = 0;
  let publishedPaise = 0;
  let voidPaise = 0;
  for (const row of groups) {
    const paise = Math.round((row._sum.amount?.toNumber() ?? 0) * 100);
    totalItems += row._count._all;
    if (row.status === "DRAFT") draftPaise += paise;
    else if (row.status === "PUBLISHED") publishedPaise += paise;
    else if (row.status === "VOID") voidPaise += paise;
  }
  return { totalItems, recordedPaise: draftPaise + publishedPaise, draftPaise, publishedPaise, voidPaise };
}
