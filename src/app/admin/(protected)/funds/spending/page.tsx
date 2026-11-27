import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth";
import { formatDonationReportINR } from "@/lib/donation-reconciliation-totals";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { spendingFilters, summarizeSpending, spendingReviewCsv, type SpendingParams } from "@/lib/fund-spending-review";
import { prisma } from "@/lib/prisma";
import { spendingPublicationReview } from "@/lib/spending-publication-review";
import { publishDisbursementAction, recordDisbursementAction, voidDisbursementAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<SpendingParams & { notice?: string; page?: string | string[] }> };
const PATH = "/admin/funds/spending";
const rupees = (paise: number) => formatDonationReportINR(paise / 100);

const POOL_LABEL = { ZAKAT: "Zakat", NON_ZAKAT: "Non-Zakat" } as const;
const REVIEWER_GUIDANCE = {
  "second-person": "Recorded by another staff member. Review the entry before publishing.",
  "same-person": "Recorded by you. Another staff member must publish.",
  "sole-operator": "Recorded by you. The configured sole-operator exception applies; self-publication is audited.",
  unrecorded: "Recorder unavailable. Investigate before publication.",
} as const;

export default async function FundSpendingPage({ searchParams }: Props) {
  const user = await requirePermission("donation.view");
  const canRecord = hasPermission(user, "donation.reconcile");
  const soleOperator = process.env.FUND_SPENDING_SOLE_OPERATOR === "true";
  const params = await searchParams;
  const { notice } = params;
  const { funds, years, where, groups, totals, pagination, entries } = await prisma.$transaction(async tx => {
    const [funds, years] = await Promise.all([
      tx.fund.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
      tx.fundDisbursement.groupBy({ by: ["financialYear"], orderBy: { financialYear: "desc" } }),
    ]);
    const where = spendingFilters(params, funds.map(fund => fund.id), years.map(year => year.financialYear));
    const groups = await tx.fundDisbursement.groupBy({ by: ["status"], where, _count: { _all: true }, _sum: { amount: true } });
    const totals = summarizeSpending(groups);
    const pagination = getAdminPagination(totals.totalItems, parseAdminPage(params.page));
    const entries = await tx.fundDisbursement.findMany({
      where,
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
      select: { id: true, pool: true, amount: true, spentOn: true, financialYear: true, title: true, status: true, voidReason: true, publicSummary: canRecord, createdById: canRecord, zakatEligibilityConfirmedAt: canRecord, fund: { select: { name: true } } },
    });
    return { funds, years, where, groups, totals, pagination, entries };
  }, { isolationLevel: "RepeatableRead" });
  const selected = {
    fund: typeof where.fundId === "string" ? where.fundId : "",
    fy: typeof where.financialYear === "string" ? where.financialYear : "",
    pool: typeof where.pool === "string" ? where.pool : "",
    status: typeof where.status === "string" ? where.status : "",
  };
  const query = Object.fromEntries(Object.entries(selected).filter(([, value]) => value !== ""));
  const spendingCsvHref = totals.totalItems > 0 ? "data:text/csv;charset=utf-8," + encodeURIComponent(spendingReviewCsv(selected, groups)) : undefined;
  const pageHref = (page: number) => ({ pathname: PATH, query: { ...query, page } });
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Where the money went</h1>
        <p className="muted">Record what each fund paid for. Entries are never edited: a mistake is voided and re-entered. A draft counts against the fund&apos;s balance straight away; the public sees it only once it is published, and a second staff member must normally publish it. <Link href="/admin/funds">Back to balances</Link></p>
      </div>
    </div>
    {notice ? <p className="status-badge" role="status">{notice.slice(0, 200)}</p> : null}
    {canRecord ? <section className="admin-card" aria-labelledby="record-heading">
      <h2 id="record-heading">Record spending</h2>
      <form action={recordDisbursementAction} className="form-grid">
        <div className="field"><label htmlFor="fundId">Fund</label><select id="fundId" name="fundId" required>{funds.map(fund => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></div>
        <div className="field"><label htmlFor="pool">Paid from</label><select id="pool" name="pool" required><option value="NON_ZAKAT">Non-Zakat money</option><option value="ZAKAT">Zakat money</option></select></div>
        <div className="field"><label htmlFor="amount">Amount (₹)</label><input id="amount" name="amount" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required /></div>
        <div className="field"><label htmlFor="spentOn">Date spent</label><input id="spentOn" name="spentOn" type="date" min="2020-01-01" required /></div>
        <div className="field full"><label htmlFor="title">Title (public)</label><input id="title" name="title" minLength={3} maxLength={120} required /></div>
        <div className="field full"><label htmlFor="publicSummary">Public summary (no names or contact details)</label><textarea id="publicSummary" name="publicSummary" maxLength={400} aria-describedby="spending-summary-hint" /><small id="spending-summary-hint">Optional for a draft; 10–400 characters are required for publication. Review for names and identifiers.</small></div>
        <fieldset className="field full"><legend>Only for Zakat money</legend>
          <label><input type="checkbox" name="zakatEligibilityConfirmed" value="yes" /> I have confirmed that every recipient is Zakat-eligible.</label>
          <label htmlFor="zakatEligibilityBasis">Basis for eligibility</label>
          <textarea id="zakatEligibilityBasis" name="zakatEligibilityBasis" maxLength={500} />
        </fieldset>
        <div className="field full"><button className="button" type="submit">Save as draft</button></div>
      </form>
    </section> : <p className="muted">Your account can view spending but cannot record it.</p>}
    <section className="admin-card" aria-labelledby="entries-heading">
      <h2 id="entries-heading">Spending history</h2>
      <p className="muted">Review all recorded spending, including draft and void entries. Filter the history by financial year, fund, money pool or status. Totals and this page of records come from the same database snapshot. Totals cover every matching record, not just the displayed page. Void entries are excluded from recorded spending. These are application records, not bank statements.</p>
      <form action={PATH} method="get" className="form-grid" aria-label="Filter spending history">
        <div className="field"><label htmlFor="review-fund">Fund</label><select id="review-fund" name="fund" defaultValue={selected.fund}><option value="">All funds</option>{funds.map(fund => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></div>
        <div className="field"><label htmlFor="review-year">Financial year (India)</label><select id="review-year" name="fy" defaultValue={selected.fy}><option value="">All years</option>{years.map(year => <option key={year.financialYear} value={year.financialYear}>{year.financialYear}</option>)}</select></div>
        <div className="field"><label htmlFor="review-pool">Money pool</label><select id="review-pool" name="pool" defaultValue={selected.pool}><option value="">All pools</option>{Object.entries(POOL_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="field"><label htmlFor="review-status">Entry status</label><select id="review-status" name="status" defaultValue={selected.status}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="VOID">Void</option></select></div>
        <div className="field full"><button className="button" type="submit">Apply filters</button> <Link href={PATH}>Reset filters</Link></div>
      </form>
      <div className="card-grid" role="group" aria-label="Filtered spending totals">
        <article className="card"><strong>{rupees(totals.recordedPaise)}</strong><p>Recorded spending (draft and published)</p></article>
        <article className="card"><strong>{rupees(totals.draftPaise)}</strong><p>Draft spending</p></article>
        <article className="card"><strong>{rupees(totals.publishedPaise)}</strong><p>Published spending</p></article>
        <article className="card"><strong>{rupees(totals.voidPaise)}</strong><p>Void entries (excluded from spending)</p></article>
      </div>
      {spendingCsvHref && <p><a className="button secondary" href={spendingCsvHref} download="amaana-filtered-spending-review.csv">Download filtered spending totals CSV</a> <span className="muted">Aggregate status totals for all matching records, not just this page. Void amounts are separate; no entry descriptions or staff identities are included.</span></p>}
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Spending history records">
      <table className="admin-table">
        <thead><tr><th scope="col">Fund</th><th scope="col">Entry</th><th scope="col">Amount</th><th scope="col">Status</th>{canRecord ? <th scope="col">Actions</th> : null}</tr></thead>
        <tbody>
          {entries.map(entry => {
            const review = canRecord ? spendingPublicationReview(entry, user.id, soleOperator) : null;
            return <tr key={entry.id}>
            <th scope="row">{entry.fund.name}<br /><small>{POOL_LABEL[entry.pool]} · FY {entry.financialYear}</small></th>
            <td>{entry.title}<br /><small>{entry.spentOn.toISOString().slice(0, 10)}</small></td>
            <td>{formatDonationReportINR(entry.amount.toNumber())}</td>
            <td>{entry.status}{entry.status === "VOID" && entry.voidReason ? <><br /><small>{entry.voidReason}</small></> : null}</td>
            {canRecord ? <td>
              {review ? <div>
                <strong>Draft publication review</strong>
                <p className="muted">{REVIEWER_GUIDANCE[review.reviewer]}</p>
                {review.summaryReady ? <><p className="muted">Proposed public summary — check for names, identifiers and factual accuracy.</p><p>{review.summary}</p></> : <p className="muted">Public summary not ready. Missing, too short, too long or contains possible contact details; the text is withheld. Void and re-enter to correct the record.</p>}
                {review.eligibility === "recorded" ? <p className="muted">Zakat eligibility confirmation recorded. Review its underlying evidence; this is not a new eligibility decision.</p> : review.eligibility === "not-recorded" ? <p className="muted">Zakat eligibility confirmation not recorded. Investigate before publication.</p> : null}
                <p className="muted">Guidance only. The server checks publication independently.</p>
              </div> : null}
              {entry.status === "DRAFT" ? <form action={publishDisbursementAction}><input type="hidden" name="id" value={entry.id} /><button className="button" type="submit">Publish</button></form> : null}
              {entry.status !== "VOID" ? <form action={voidDisbursementAction}><input type="hidden" name="id" value={entry.id} /><label htmlFor={`reason-${entry.id}`} className="muted">Reason to void</label><input id={`reason-${entry.id}`} name="reason" minLength={5} maxLength={500} required /><button className="text-button" type="submit">Void</button></form> : null}
            </td> : null}
          </tr>;
          })}
          {entries.length === 0 ? <tr><td colSpan={canRecord ? 5 : 4}>No spending records match this view.</td></tr> : null}
        </tbody>
      </table>
      </div>
      <nav className="filter-row" aria-label="Spending history pagination">
        {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
        <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
        {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
      </nav>
    </section>
  </>;
}
