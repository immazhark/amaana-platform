import { loadFundsLedger } from "@/lib/funds-ledger";
import { indianFinancialYear, type FundTotals, type FundZakatPolicyId } from "@/lib/giving-funds";
import { prisma } from "@/lib/prisma";

// First financial year the public ledger can show: the year designated giving opened.
export const FIRST_PUBLIC_FINANCIAL_YEAR = "2026-27";
const MAX_ENTRIES = 500;

export type FinancialYearRange = { label: string; start: Date; end: Date };

// Indian financial year (1 April to 31 March, IST) as a half-open [start, end) UTC range. Null for any label that
// is not a real "YYYY-YY" year.
export function financialYearRange(label: string): FinancialYearRange | null {
  const match = /^(\d{4})-(\d{2})$/.exec(label);
  if (!match) return null;
  const startYear = Number(match[1]);
  if (startYear < 2000 || startYear > 2099 || (startYear + 1) % 100 !== Number(match[2])) return null;
  const istOffsetMs = 330 * 60_000;
  return { label, start: new Date(Date.UTC(startYear, 3, 1) - istOffsetMs), end: new Date(Date.UTC(startYear + 1, 3, 1) - istOffsetMs) };
}

// The current financial year and any earlier ones since the ledger opened, newest first.
export function selectableFinancialYears(now: Date): string[] {
  const current = indianFinancialYear(now);
  const first = Number(FIRST_PUBLIC_FINANCIAL_YEAR.slice(0, 4));
  const years: string[] = [];
  for (let year = Number(current.slice(0, 4)); year >= first; year -= 1) years.push(`${year}-${String((year + 1) % 100).padStart(2, "0")}`);
  return years.length > 0 ? years : [FIRST_PUBLIC_FINANCIAL_YEAR];
}

// Accept only a year the ledger actually offers; anything else falls back to the current year.
export function resolveFinancialYear(requested: string | string[] | undefined, now: Date): FinancialYearRange {
  const offered = selectableFinancialYears(now);
  const label = typeof requested === "string" && offered.includes(requested) ? requested : (offered[0] ?? FIRST_PUBLIC_FINANCIAL_YEAR);
  return financialYearRange(label) ?? (financialYearRange(FIRST_PUBLIC_FINANCIAL_YEAR) as FinancialYearRange);
}

export type PublicFundInput = { id: string; slug: string; name: string; summary: string; zakatPolicy: FundZakatPolicyId };
export type PublicSpendEntry = { id: string; fundId: string; title: string; publicSummary: string | null; amountPaise: number; spentOn: string; pool: "ZAKAT" | "NON_ZAKAT" };
export type PublicFundRow = {
  slug: string; name: string; summary: string; zakatPolicy: FundZakatPolicyId;
  receivedPaise: number; spentPaise: number; heldPaise: number; spentShare: number; entries: PublicSpendEntry[];
};

const ZERO: FundTotals["total"] = { receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0 };

// Public figures use verified receipts and PUBLISHED spending only. "Held" is everything received to date minus
// everything published as spent to date, never below zero, so unpublished drafts are neither shown nor implied.
export function shapePublicFundLedger(input: {
  funds: readonly PublicFundInput[];
  inYear: Record<string, FundTotals>;
  toDate: Record<string, FundTotals>;
  entries: readonly PublicSpendEntry[];
}) {
  const rows: PublicFundRow[] = input.funds.map(fund => {
    const year = input.inYear[fund.id]?.total ?? ZERO;
    const todate = input.toDate[fund.id]?.total ?? ZERO;
    const receivedPaise = year.receivedPaise;
    const spentPaise = year.publishedSpentPaise;
    return {
      slug: fund.slug, name: fund.name, summary: fund.summary, zakatPolicy: fund.zakatPolicy,
      receivedPaise, spentPaise,
      heldPaise: Math.max(0, todate.receivedPaise - todate.publishedSpentPaise),
      spentShare: receivedPaise > 0 ? Math.min(1, spentPaise / receivedPaise) : 0,
      entries: input.entries.filter(entry => entry.fundId === fund.id),
    };
  });
  const totals = rows.reduce((sum, row) => ({ receivedPaise: sum.receivedPaise + row.receivedPaise, spentPaise: sum.spentPaise + row.spentPaise, heldPaise: sum.heldPaise + row.heldPaise }), { receivedPaise: 0, spentPaise: 0, heldPaise: 0 });
  return { rows, totals };
}

type DecimalLike = { mul: (n: number) => { toNumber: () => number } };

export async function getPublicFundLedger(range: FinancialYearRange) {
  // Keep annual and all-time totals and the published entries on one database snapshot.
  const [funds, inYear, toDate, published] = await prisma.$transaction(async tx => Promise.all([
    tx.fund.findMany({ where: { status: "ACTIVE" }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true, summary: true, zakatPolicy: true } }),
    loadFundsLedger(tx, { capturedIn: range, spentIn: range }),
    loadFundsLedger(tx),
    tx.fundDisbursement.findMany({
      where: { status: "PUBLISHED", spentOn: { gte: range.start, lt: range.end } },
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
      take: MAX_ENTRIES,
      select: { id: true, fundId: true, title: true, publicSummary: true, amount: true, spentOn: true, pool: true },
    }),
  ]), { isolationLevel: "RepeatableRead" });
  const entries: PublicSpendEntry[] = published.map(row => ({
    id: row.id, fundId: row.fundId, title: row.title, publicSummary: row.publicSummary,
    amountPaise: Math.round((row.amount as unknown as DecimalLike).mul(100).toNumber()),
    spentOn: row.spentOn.toISOString().slice(0, 10), pool: row.pool,
  }));
  return shapePublicFundLedger({ funds, inYear: inYear.byFund, toDate: toDate.byFund, entries });
}
