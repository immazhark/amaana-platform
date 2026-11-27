import Link from "next/link";
import { DonationIntent, DonationPaymentMethod, DonationStatus, Prisma } from "@prisma/client";
import { AdminDonationFunnel } from "@/components/admin-donation-funnel";
import { summariseDonationFunnel } from "@/lib/donation-funnel";
import { requirePermission } from "@/lib/auth";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { donationIntentLabel } from "@/lib/donation-intent";
import { donationExceptionFilter, donationExceptionWhere } from "@/lib/donation-exception-review";
import { formatDonationReportINR, loadDonationReconciliationReport } from "@/lib/donation-reconciliation-totals";
import { prisma } from "@/lib/prisma";
import { readDonationReport } from "@/lib/read-donation-report";
import { logServerError } from "@/lib/server-log";
import { donationOperationalState } from "@/lib/operational-signals";
import { donationReviewFilters, loadPendingTransferReview } from "@/lib/pending-transfer-review";

const FUNNEL_WINDOW_DAYS = 90;
const funnelSince = () => new Date(Date.now() - FUNNEL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

const PAYMENT_METHOD_LABELS: Record<DonationPaymentMethod, string> = {
  RAZORPAY: "Razorpay",
  DIRECT_UPI: "Direct UPI",
  BANK_TRANSFER: "Bank transfer",
};
type Props = { searchParams: Promise<{ status?: string; intent?: string; method?: string; page?: string; reference?: string | string[]; sort?: string | string[]; issue?: string | string[] }> };

export default async function DonationsPage({ searchParams }: Props) {
  await requirePermission("donation.view");
  const { status, intent, method, page: pageParam, reference, sort, issue } = await searchParams;
  const review = donationReviewFilters(reference, sort);
  const referenceScope: Prisma.DonationWhereInput = review.invalidReference ? { id: { in: [] } } : review.reference ? { referenceNumber: review.reference } : {};
  const exception = donationExceptionFilter(issue);
  const referenceQuery = review.reference ? { reference: review.reference } : review.invalidReference ? { reference: "invalid" } : {};
  const reviewQuery = { ...referenceQuery, ...(review.direction === "asc" ? { sort: "oldest" } : {}), ...exception.query };
  const selected = Object.values(DonationStatus).includes(status as DonationStatus)
    ? status as DonationStatus
    : undefined;
  const selectedIntent = Object.values(DonationIntent).includes(intent as DonationIntent)
    ? intent as DonationIntent
    : undefined;
  const selectedMethod = Object.values(DonationPaymentMethod).includes(method as DonationPaymentMethod) ? method as DonationPaymentMethod : undefined;
  const methodScope = selectedMethod ? { paymentMethod: selectedMethod } : {};
  const where: Prisma.DonationWhereInput = {
    ...methodScope,
    ...referenceScope,
    ...exception.scope,
    ...(selected ? { status: selected } : {}),
    ...(selectedIntent ? { givingIntent: selectedIntent } : {}),
  };

  const [totalItems, reconciliation, unmatchedCriticalEventCount, unmatchedCriticalEvents, missingAcknowledgements, refundedWithoutCompletionTime, statusGroups, intentGroups, funnel, pendingReview] = await Promise.all([
    prisma.donation.count({ where }),
    readDonationReport(() => loadDonationReconciliationReport(prisma), () => logServerError("donation.reconciliation_report_unavailable")),
    prisma.paymentEvent.count({
      where: {
        donationId: null,
        eventType: { in: ["payment.captured", "payment.failed", "refund.processed"] },
      },
    }),
    prisma.paymentEvent.findMany({
      where: {
        donationId: null,
        eventType: { in: ["payment.captured", "payment.failed", "refund.processed"] },
      },
      orderBy: [{ processedAt: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        providerEventId: true,
        eventType: true,
        processedAt: true,
      },
    }),
    prisma.donation.count({ where: donationExceptionWhere("missing-acknowledgement") }),
    prisma.donation.count({ where: donationExceptionWhere("missing-refund-time") }),
    prisma.donation.groupBy({
      by: ["status"],
      where: { ...methodScope, ...referenceScope, ...exception.scope, ...(selectedIntent ? { givingIntent: selectedIntent } : {}) },
      _count: { _all: true },
    }),
    prisma.donation.groupBy({
      by: ["givingIntent"],
      where: { ...methodScope, ...referenceScope, ...exception.scope, ...(selected ? { status: selected } : {}) },
      _count: { _all: true },
    }),
    // Aggregate counts only: no donor row, amount, reference or contact detail leaves the database for this card.
    readDonationReport(async () => {
      const groups = await prisma.donation.groupBy({
        by: ["paymentMethod", "status"],
        where: { createdAt: { gte: funnelSince() } },
        _count: { _all: true },
      });
      return summariseDonationFunnel(groups);
    }, () => logServerError("donation.outcomes_report_unavailable")),
    readDonationReport(() => loadPendingTransferReview(prisma), () => logServerError("donation.pending_transfer_report_unavailable")),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const donations = await prisma.donation.findMany({
    where,
    select: {
      id: true,
      referenceNumber: true,
      donorName: true,
      donorEmail: true,
      givingIntent: true,
      paymentMethod: true,
      amount: true,
      refundedAmount: true,
      status: true,
      createdAt: true,
      appeal: { select: { title: true } },
      fund: { select: { name: true } },
    },
    orderBy: [{ createdAt: review.direction }, { id: review.direction }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const statusCounts = new Map(statusGroups.map(item => [item.status, item._count._all]));
  const intentCounts = new Map(intentGroups.map(item => [item.givingIntent, item._count._all]));
  const totals = reconciliation?.totals;
  const operational = donationOperationalState({
    unmatchedCriticalEvents: unmatchedCriticalEventCount,
    missingAcknowledgements,
    refundedWithoutCompletionTime,
  });
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/donations",
    query: {
      ...(selected ? { status: selected } : {}),
      ...(selectedIntent ? { intent: selectedIntent } : {}),
      ...(selectedMethod ? { method: selectedMethod } : {}),
      ...reviewQuery,
      page: targetPage,
    },
  });
  const statusHref = (nextStatus?: DonationStatus) => ({
    pathname: "/admin/donations",
    query: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(selectedMethod ? { method: selectedMethod } : {}),
      ...(selectedIntent ? { intent: selectedIntent } : {}),
      ...reviewQuery,
    },
  });
  const intentHref = (nextIntent?: DonationIntent) => ({
    pathname: "/admin/donations",
    query: {
      ...(selected ? { status: selected } : {}),
      ...(nextIntent ? { intent: nextIntent } : {}),
      ...(selectedMethod ? { method: selectedMethod } : {}),
      ...reviewQuery,
    },
  });

  const methodHref = (nextMethod?: DonationPaymentMethod) => ({
    pathname: "/admin/donations",
    query: {
      ...(selected ? { status: selected } : {}),
      ...(selectedIntent ? { intent: selectedIntent } : {}),
      ...(nextMethod ? { method: nextMethod } : {}),
      ...reviewQuery,
    },
  });

  const listScope = { ...(selected ? { status: selected } : {}), ...(selectedIntent ? { intent: selectedIntent } : {}), ...(selectedMethod ? { method: selectedMethod } : {}), ...referenceQuery, ...exception.query };

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Reconciliation</p>
        <h1>Donations</h1>
        {totals ? <p className="lead">
          Gross captured: {formatDonationReportINR(totals.grossCaptured)} · Refunded: {formatDonationReportINR(totals.refunded)} · Net retained: {formatDonationReportINR(totals.netRetained)}
          <small className="muted"> (Donation amounts only; returned processing fees excluded.)</small>
        </p> : <p role="status">Financial summary temporarily unavailable. Do not interpret this as zero receipts or refunds. Individual records remain below.</p>}
      </div>
    </div>
    <section className="admin-card" aria-labelledby="donation-health-heading" style={{ marginBottom: "1.25rem" }}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Payment health</p>
          <h2 id="donation-health-heading">Operational signals</h2>
          <p className="muted">These counters flag reconciliation and acknowledgement invariants that need review even when payment infrastructure itself is reachable. They are global and may overlap; they do not count distinct affected donations.</p>
        </div>
        <span className="status-badge">{operational.status === "attention" ? `${operational.attention} NEED ATTENTION` : !totals || !pendingReview ? "REVIEW INCOMPLETE" : "HEALTHY"}</span>
      </div>
      <div className="card-grid">
        <article className="card"><strong>{totals?.pendingCount ?? "Unavailable"}</strong><p>Direct UPI/bank transfers awaiting statement verification</p></article>
        <article className="card"><strong>{operational.unmatchedCriticalEvents}</strong><p>Unmatched critical payment events</p>{unmatchedCriticalEvents.length > 0 && <Link href="#unmatched-payment-events">Review latest unmatched events</Link>}</article>
        <article className="card"><strong>{operational.missingAcknowledgements}</strong><p>Captured/refunded donations without acknowledgement numbers</p>{operational.missingAcknowledgements > 0 && <Link href={{ pathname: "/admin/donations", query: { issue: "missing-acknowledgement", sort: "oldest" } }}>Review missing acknowledgements, oldest first</Link>}</article>
        <article className="card"><strong>{operational.refundedWithoutCompletionTime}</strong><p>Refunded donations missing completion time</p>{operational.refundedWithoutCompletionTime > 0 && <Link href={{ pathname: "/admin/donations", query: { issue: "missing-refund-time", sort: "oldest" } }}>Review missing refund times, oldest first</Link>}</article>
      </div>
    </section>
    <section className="admin-card" aria-labelledby="payment-channel-heading" style={{ marginBottom: "1.25rem" }}>
      <h2 id="payment-channel-heading">Payment channel reconciliation</h2>
      <p className="muted">All recorded donations, independent of the list filters. Verified principal excludes processing fees; unverified transfer claims are not receipts. These application totals are not bank balances or provider settlement statements.</p>
      {!reconciliation ? <p role="status">Payment channel report temporarily unavailable. Review individual records before relying on any totals.</p> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Payment channel reconciliation totals">
        <table>
          <thead><tr><th scope="col">Payment channel</th><th scope="col">Gross verified</th><th scope="col">Principal refunded</th><th scope="col">Net retained</th><th scope="col">Unverified claims</th><th scope="col">Claim amount</th></tr></thead>
          <tbody>{Object.values(DonationPaymentMethod).map(channel => {
            const row = reconciliation.methods.find(item => item.paymentMethod === channel);
            return <tr key={channel}>
              <th scope="row"><Link href={{ pathname: "/admin/donations", query: { method: channel } }}>{PAYMENT_METHOD_LABELS[channel]} records</Link></th>
              <td>{formatDonationReportINR(row?.grossCaptured ?? 0)}</td>
              <td>{formatDonationReportINR(row?.refunded ?? 0)}</td>
              <td>{formatDonationReportINR(row?.netRetained ?? 0)}</td>
              <td>{row?.pendingCount ? <Link href={{ pathname: "/admin/donations", query: { method: channel, status: "PENDING_VERIFICATION" } }}>{row.pendingCount} pending</Link> : "0"}</td>
              <td>{formatDonationReportINR(row?.pendingAmount ?? 0)}</td>
            </tr>;
          })}</tbody>
          <tfoot><tr><th scope="row">All channels</th><td>{formatDonationReportINR(reconciliation.totals.grossCaptured)}</td><td>{formatDonationReportINR(reconciliation.totals.refunded)}</td><td>{formatDonationReportINR(reconciliation.totals.netRetained)}</td><td>{reconciliation.totals.pendingCount}</td><td>{formatDonationReportINR(reconciliation.totals.pendingAmount)}</td></tr></tfoot>
        </table>
      </div>}
    </section>
    <section className="admin-card" aria-labelledby="pending-review-heading" style={{ marginBottom: "1.25rem" }}>
      <h2 id="pending-review-heading">Direct-transfer review workbench</h2>
      <p className="muted">All pending UPI and bank-transfer claims, independent of the list filters. Age is time since the claim was submitted, not the bank credit date or a promised verification time. Review the independent bank credit before deciding; these claims are not receipts.</p>
      {pendingReview === null ? <div><p role="status">Transfer age report temporarily unavailable. No count can be inferred. Review the original claims.</p><div className="filter-row">{(["DIRECT_UPI", "BANK_TRANSFER"] as const).map(method => <Link key={method} href={{ pathname: "/admin/donations", query: { method, status: "PENDING_VERIFICATION", sort: "oldest" } }}>Review {PAYMENT_METHOD_LABELS[method]} claims</Link>)}</div></div> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Pending transfer claim age">
        <table>
          <thead><tr><th scope="col">Method</th><th scope="col">Under 24 hours</th><th scope="col">1–7 days</th><th scope="col">Over 7 days</th><th scope="col">Future timestamp</th><th scope="col">Review queue</th></tr></thead>
          <tbody>{pendingReview.map(row => <tr key={row.paymentMethod}>
            <th scope="row">{PAYMENT_METHOD_LABELS[row.paymentMethod]}</th>
            <td>{row.underDay}</td><td>{row.oneToSevenDays}</td><td>{row.overSevenDays}</td><td>{row.future}</td>
            <td>{row.total ? <Link href={{ pathname: "/admin/donations", query: { method: row.paymentMethod, status: "PENDING_VERIFICATION", sort: "oldest" } }}>{row.total} pending, oldest first</Link> : "0"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
    {funnel === null ? <section className="card" aria-labelledby="donation-funnel-unavailable-heading"><h2 id="donation-funnel-unavailable-heading">Donation outcomes, last {FUNNEL_WINDOW_DAYS} days</h2><p role="status">Donation outcomes report temporarily unavailable. This does not mean no donations were started.</p></section> : <AdminDonationFunnel rows={funnel} windowDays={FUNNEL_WINDOW_DAYS} />}
    {unmatchedCriticalEvents.length > 0 && <section className="admin-card" id="unmatched-payment-events" aria-labelledby="unmatched-payment-events-heading" style={{ marginBottom: "1.25rem" }}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Reconciliation attention</p>
          <h2 id="unmatched-payment-events-heading">Unmatched payment events</h2>
          <p className="muted">Critical Razorpay events were received without a linked local donation. Review these before relying on payment totals. The newest 10 are shown below.</p>
        </div>
        <span className="status-badge">{unmatchedCriticalEventCount} unresolved</span>
      </div>
      <ol className="history">
        {unmatchedCriticalEvents.map(event => <li key={event.id}>
          <strong>{event.eventType}</strong>
          <span>{event.processedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
          <small>{event.providerEventId}</small>
        </li>)}
      </ol>
    </section>}
    {(exception.issue || exception.invalid) && <section className="admin-card" aria-labelledby="donation-exception-heading">
      <h2 id="donation-exception-heading">Reconciliation exception review</h2>
      {exception.invalid ? <p role="status">Unsupported review filter. No records were matched.</p> : <p role="status">{exception.issue === "missing-acknowledgement" ? "Captured or refunded records with no acknowledgement number." : "Refunded records with no recorded completion timestamp."} Additional filters narrow this list. Review the existing evidence; this view does not repair records or authorize payments.</p>}
      <Link href={{ pathname: "/admin/donations", query: { ...(selected ? { status: selected } : {}), ...(selectedIntent ? { intent: selectedIntent } : {}), ...(selectedMethod ? { method: selectedMethod } : {}), ...referenceQuery, ...(review.direction === "asc" ? { sort: "oldest" } : {}) } }}>Clear exception review</Link>
    </section>}
    <section className="admin-card" aria-labelledby="donation-lookup-heading">
      <h2 id="donation-lookup-heading">Find a donation</h2>
      <form method="get" action="/admin/donations" className="form-grid" aria-label="Exact donation reference lookup">
        {selected && <input type="hidden" name="status" value={selected}/>}
        {selectedIntent && <input type="hidden" name="intent" value={selectedIntent}/>}
        {selectedMethod && <input type="hidden" name="method" value={selectedMethod}/>}
        {review.direction === "asc" && <input type="hidden" name="sort" value="oldest"/>}
        {exception.query.issue && <input type="hidden" name="issue" value={exception.query.issue}/> }
        <div className="field"><label htmlFor="donation-reference">Donation reference</label><input id="donation-reference" name="reference" defaultValue={review.reference ?? ""} maxLength={17} pattern="[Aa][Ff][Dd]-[0-9]{4}-[0-9]{8}" placeholder="AFD-2026-12345678" aria-describedby="donation-reference-hint"/><small id="donation-reference-hint">Enter only the Amaana donation reference, not a bank reference, receipt token, email or phone number.</small></div>
        <div className="field"><button type="submit" className="button">Find exact reference</button></div>
      </form>
      {review.invalidReference && <p role="status">Enter a valid Amaana donation reference. No records were matched.</p>}
      {(review.reference || review.invalidReference) && <Link href={{ pathname: "/admin/donations", query: { ...(selected ? { status: selected } : {}), ...(selectedIntent ? { intent: selectedIntent } : {}), ...(selectedMethod ? { method: selectedMethod } : {}), ...(review.direction === "asc" ? { sort: "oldest" } : {}), ...exception.query } }}>Clear reference lookup</Link>}
    </section>
    <div className="filter-row" role="group" aria-label="Donation ordering"><strong>Received:</strong><Link href={{ pathname: "/admin/donations", query: listScope }} aria-current={review.direction === "desc" ? "page" : undefined}>Newest first</Link><Link href={{ pathname: "/admin/donations", query: { ...listScope, sort: "oldest" } }} aria-current={review.direction === "asc" ? "page" : undefined}>Oldest first</Link></div>
    <div className="filter-row" role="group" aria-label="Donation status filter">
      <strong>Status:</strong>
      <Link href={statusHref()} aria-current={!selected ? "page" : undefined}>All</Link>
      {Object.values(DonationStatus).map(item => <Link key={item} href={statusHref(item)} aria-current={selected === item ? "page" : undefined}>{item} ({statusCounts.get(item) ?? 0})</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Giving intention filter">
      <strong>Giving intention:</strong>
      <Link href={intentHref()} aria-current={!selectedIntent ? "page" : undefined}>All</Link>
      {Object.values(DonationIntent).map(item => <Link key={item} href={intentHref(item)} aria-current={selectedIntent === item ? "page" : undefined}>{donationIntentLabel(item)} ({intentCounts.get(item) ?? 0})</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Payment method filter">
      <strong>Payment method:</strong>
      <Link href={methodHref()} aria-current={!selectedMethod ? "page" : undefined}>All</Link>
      {Object.values(DonationPaymentMethod).map(channel => <Link key={channel} href={methodHref(channel)} aria-current={selectedMethod === channel ? "page" : undefined}>{PAYMENT_METHOD_LABELS[channel]}</Link>)}
    </div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Donation records">
      <table>
        <thead><tr><th>Reference</th><th>Donor</th><th>Appeal</th><th>Intent</th><th>Method</th><th>Amount</th><th>Total returned (incl. fees)</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>{donations.map(donation => <tr key={donation.id}>
          <td><Link href={`/admin/donations/${donation.id}`}><strong>{donation.referenceNumber}</strong></Link></td>
          <td>{donation.donorName}<br/><small>{donation.donorEmail}</small></td>
          <td>{donation.appeal?.title ?? donation.fund?.name ?? "—"}</td>
          <td>{donationIntentLabel(donation.givingIntent)}</td>
          <td>{PAYMENT_METHOD_LABELS[donation.paymentMethod]}</td>
          <td>{formatDonationReportINR(donation.amount.toNumber())}</td>
          <td>{formatDonationReportINR(donation.refundedAmount.toNumber())}</td>
          <td><span className="status-badge">{donation.status}</span></td>
          <td>{donation.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
        </tr>)}</tbody>
      </table>
      {donations.length === 0 && <p className="empty-state">No donations match this view.</p>}
    </div>
    <nav className="filter-row" aria-label="Donation pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
