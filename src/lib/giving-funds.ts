// Designated funds share one bank account; received/spent is accounted per fund and per Zakat pool.
export type FundZakatPolicyId = "ACCEPTED" | "NOT_ACCEPTED" | "UNDER_REVIEW";
export type GivingIntentId = "GENERAL" | "SADAQAH" | "ZAKAT";

// UNDER_REVIEW is treated exactly like NOT_ACCEPTED until the owner rules on the fund.
export function allowedIntentsForFund(policy: FundZakatPolicyId): GivingIntentId[] {
  return policy === "ACCEPTED" ? ["GENERAL", "SADAQAH", "ZAKAT"] : ["GENERAL", "SADAQAH"];
}

export function isIntentAllowedForFund(policy: FundZakatPolicyId, intent: string): boolean {
  return (allowedIntentsForFund(policy) as string[]).includes(intent);
}

export function zakatNoticeForFund(policy: FundZakatPolicyId): string | null {
  if (policy === "NOT_ACCEPTED") return "Zakat is not accepted for this fund. Only non-Zakat contributions (General Charity or Sadaqah) are accepted.";
  if (policy === "UNDER_REVIEW") return "Zakat acceptance for this fund is under review. Please give Zakat to the General Fund.";
  return null;
}

// Indian financial year (1 April to 31 March) of an instant, evaluated in IST, e.g. "2026-27".
export function indianFinancialYear(at: Date): string {
  const ist = new Date(at.getTime() + 330 * 60_000);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export type DonationLedgerRow = { fundId: string | null; givingIntent: string; status: string; amountPaise: number; refundedPaise: number };
export type DisbursementLedgerRow = { fundId: string; pool: "ZAKAT" | "NON_ZAKAT"; status: string; amountPaise: number };
export type PoolTotals = { receivedPaise: number; pendingPaise: number; refundedPaise: number; spentPaise: number; publishedSpentPaise: number; balancePaise: number };
export type FundTotals = { zakat: PoolTotals; nonZakat: PoolTotals; total: PoolTotals };

const emptyPool = (): PoolTotals => ({ receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0 });
export const APPEAL_BUCKET = "APPEAL";

// Received = verified money net of refunds. Pending bank/UPI claims are never received. Spent counts every
// non-void disbursement (drafts included, so a fund cannot be over-spent); the public figure counts published only.
export function summariseFunds(donations: DonationLedgerRow[], disbursements: DisbursementLedgerRow[]) {
  const byFund: Record<string, FundTotals> = {};
  const zakatAccount = emptyPool();
  const bucket = (key: string) => (byFund[key] ??= { zakat: emptyPool(), nonZakat: emptyPool(), total: emptyPool() });
  for (const row of donations) {
    const fund = bucket(row.fundId ?? APPEAL_BUCKET);
    const isZakat = row.givingIntent === "ZAKAT";
    const targets = [isZakat ? fund.zakat : fund.nonZakat, fund.total, ...(isZakat ? [zakatAccount] : [])];
    for (const pool of targets) {
      if (row.status === "CAPTURED" || row.status === "REFUNDED") {
        pool.receivedPaise += row.amountPaise - row.refundedPaise;
        pool.refundedPaise += row.refundedPaise;
      } else if (row.status === "PENDING_VERIFICATION") {
        pool.pendingPaise += row.amountPaise;
      }
    }
  }
  for (const row of disbursements) {
    if (row.status === "VOID") continue;
    const fund = bucket(row.fundId);
    const targets = [row.pool === "ZAKAT" ? fund.zakat : fund.nonZakat, fund.total, ...(row.pool === "ZAKAT" ? [zakatAccount] : [])];
    for (const pool of targets) {
      pool.spentPaise += row.amountPaise;
      if (row.status === "PUBLISHED") pool.publishedSpentPaise += row.amountPaise;
    }
  }
  const finish = (pool: PoolTotals) => { pool.balancePaise = pool.receivedPaise - pool.spentPaise; };
  for (const fund of Object.values(byFund)) { finish(fund.zakat); finish(fund.nonZakat); finish(fund.total); }
  finish(zakatAccount);
  return { byFund, zakatAccount };
}

// A disbursement may only draw on verified money in the pool it names.
export function canDisburse(totals: FundTotals, pool: "ZAKAT" | "NON_ZAKAT", amountPaise: number): boolean {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) return false;
  return amountPaise <= (pool === "ZAKAT" ? totals.zakat : totals.nonZakat).balancePaise;
}
