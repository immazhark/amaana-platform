import { TALEEM_CATALOGUE } from "@/content/taleem-catalogue";
import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import { donationRecordAmounts, formatDonationReportINR } from "@/lib/donation-reconciliation-totals";
import { formatINR } from "@/lib/appeals";
import { donationIntentLabel } from "@/lib/donation-intent";
import { donationDetailHref, donationQueueHref, donationReturnFilters, parsePaymentEventBoundary, paymentEventPage, paymentEventSelection } from "@/lib/donation-review-navigation";
import { prisma } from "@/lib/prisma";
import { getDonationEvidenceUrl } from "@/lib/storage";
import { logServerError } from "@/lib/server-log";
import { reconcileDonationAction, reissueReceiptLinkAction } from "../actions";
import { AdminActionFeedbackForm } from "@/components/admin-action-feedback-form";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };
const formatDateTime = (value: Date | null) => value ? value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not recorded";
const methodLabel = (value: string) => value === "DIRECT_UPI" ? "Direct UPI" : value === "BANK_TRANSFER" ? "Bank transfer" : "Razorpay";

export default async function DonationDetailPage({ params, searchParams }: Props) {
  const user = await requirePermission("donation.view");
  const { id } = await params;
  const search: Record<string, string | string[] | undefined> = await (searchParams ?? Promise.resolve({}));
  const returnFilters = donationReturnFilters(search);
  const eventBoundary = parsePaymentEventBoundary(search.eventsBefore);
  const donation = await prisma.donation.findUnique({
    where: { id },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      donorName: true,
      isAnonymous: true,
      donorEmail: true,
      donorPhone: true,
      givingIntent: true,
      paymentMethod: true,
      transferReference: true,
      transferredAt: true,
      transferEvidenceKey: true,
      reconciliationNotes: true,
      providerOrderId: true,
      providerPaymentId: true,
      receiptNumber: true,
      amount: true,
      refundedAmount: true,
      feeContributionAmount: true,
      createdAt: true,
      capturedAt: true,
      failedAt: true,
      refundedAt: true,
      appeal: { select: { title: true } },
      fund: { select: { name: true } },
      sponsorshipProgramme: true,
      sponsorshipUnits: true,
      sponsorshipMonths: true,
      sponsorshipMonthlyRate: true,
      sponsorshipRateVersion: true,
      events: paymentEventSelection(eventBoundary),
      reconciledBy: { select: { name: true } },
    },
  });
  if (!donation) notFound();
  const history = paymentEventPage(donation.events);
  const canReconcile = hasPermission(user, "donation.reconcile");
  const direct = donation.paymentMethod !== "RAZORPAY";
  let evidenceUrl: string | null = null;
  if (direct && donation.transferEvidenceKey) {
    try {
      evidenceUrl = await getDonationEvidenceUrl(donation.transferEvidenceKey, donation.id);
    } catch {
      logServerError("donation.detail_evidence_unavailable");
    }
  }
  const evidenceUnavailable = Boolean(donation.transferEvidenceKey) && !evidenceUrl;
  const { amount, coveredFee, totalReturned, donationRefunded, netRetained } = donationRecordAmounts(donation);

  return <>
    <div className="admin-heading"><div><p className="eyebrow">{donation.referenceNumber}</p><h1>{formatDonationReportINR(amount)}</h1><p className="muted">{donation.appeal?.title ?? donation.fund?.name ?? "—"}</p></div><span className="status-badge">{donation.status}</span></div>
    <a className="button secondary" href={donationQueueHref(returnFilters)}>Return to donation queue</a>
    <div className="admin-detail-grid">
      <section className="card"><h2>Donation record</h2><dl className="details">
        <div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Public anonymity</dt><dd>{donation.isAnonymous ? "Anonymous" : "Name may be shown"}</dd></div>
        <div><dt>Email</dt><dd>{donation.donorEmail}</dd></div><div><dt>Phone</dt><dd>{donation.donorPhone ?? "Not supplied"}</dd></div>
        <div><dt>Giving intention</dt><dd>{donationIntentLabel(donation.givingIntent)}</dd></div>{donation.sponsorshipProgramme && donation.sponsorshipUnits && donation.sponsorshipMonths && donation.sponsorshipMonthlyRate && <div><dt>Programme sponsorship</dt><dd>{TALEEM_CATALOGUE.programmes.find(item => item.id === donation.sponsorshipProgramme)?.name ?? donation.sponsorshipProgramme}: {donation.sponsorshipUnits} {donation.sponsorshipUnits === 1 ? "unit" : "units"} × {donation.sponsorshipMonths} {donation.sponsorshipMonths === 1 ? "month" : "months"} × {formatINR(donation.sponsorshipMonthlyRate.toNumber())} a month (rate version {donation.sponsorshipRateVersion})</dd></div>}<div><dt>Payment method</dt><dd>{methodLabel(donation.paymentMethod)}</dd></div>
        {direct ? <><div><dt>Transfer reference / UTR</dt><dd>{donation.transferReference}</dd></div><div><dt>Transfer date</dt><dd>{formatDateTime(donation.transferredAt)}</dd></div><div><dt>Evidence</dt><dd>{evidenceUrl ? <a href={evidenceUrl} target="_blank" rel="noreferrer">Open private evidence<span className="sr-only"> (opens in a new tab)</span></a> : evidenceUnavailable ? "Evidence supplied; private link unavailable. Reload or contact an administrator." : "Not supplied"}</dd></div><div><dt>Reconciled by</dt><dd>{donation.reconciledBy?.name ?? "Pending"}</dd></div><div><dt>Reconciliation notes</dt><dd>{donation.reconciliationNotes ?? "Pending"}</dd></div></> : <><div><dt>Razorpay order</dt><dd>{donation.providerOrderId}</dd></div><div><dt>Razorpay payment</dt><dd>{donation.providerPaymentId ?? "Pending"}</dd></div></>}
        <div><dt>Acknowledgement</dt><dd>{donation.receiptNumber ?? "Pending"}</dd></div><div><dt>Donation amount</dt><dd>{formatDonationReportINR(amount)}</dd></div>{coveredFee > 0 && <div><dt>Covered processing fee</dt><dd>{formatDonationReportINR(coveredFee)}</dd></div>}<div><dt>Total returned (including any fee)</dt><dd>{formatDonationReportINR(totalReturned)}</dd></div><div><dt>Donation refunded</dt><dd>{formatDonationReportINR(donationRefunded)}</dd></div><div><dt>Net retained</dt><dd>{formatDonationReportINR(netRetained)}</dd></div>
        <div><dt>Created</dt><dd>{formatDateTime(donation.createdAt)}</dd></div><div><dt>Captured</dt><dd>{formatDateTime(donation.capturedAt)}</dd></div><div><dt>Failed</dt><dd>{formatDateTime(donation.failedAt)}</dd></div><div><dt>Fully refunded</dt><dd>{formatDateTime(donation.refundedAt)}</dd></div>
      </dl></section>
      <aside className="card">
        {direct && donation.status === "PENDING_VERIFICATION" ? <><h2>Reconcile transfer</h2><p className="muted">Verify against Amaana&apos;s bank/UPI statement before approving. A donor-entered UTR or screenshot is evidence to review, not proof of receipt.</p>{canReconcile ? <form action={reconcileDonationAction} className="form-grid"><input type="hidden" name="donationId" value={donation.id}/><div className="field full"><label htmlFor="notes">Reconciliation notes</label><textarea id="notes" name="notes" minLength={3} maxLength={1000} required /></div><div className="field full"><button className="button" type="submit" name="decision" value="VERIFY">Verify received transfer</button> <button className="text-button" type="submit" name="decision" value="REJECT">Reject claim</button></div></form> : <p className="muted">Your account can view this record but cannot reconcile donations.</p>}</> : <><h2 id="payment-events-heading">Payment events</h2>{history.events.length ? <>
          <p className="muted">Showing {history.events.length} {eventBoundary ? "older" : "most recent"} payment events, newest first.</p>
          <ol className="history">{history.events.map(event => <li key={event.id}><strong>{event.eventType}</strong><span>{formatDateTime(event.processedAt)}</span><small>{event.providerEventId}</small></li>)}</ol>
        </> : <p className="muted">{eventBoundary ? "No older payment events on this page." : direct ? "Direct transfers do not generate Razorpay webhook events." : "No webhook events recorded yet."}</p>}
        {(eventBoundary || history.older) && <nav className="filter-row" aria-label="Payment event history navigation">
          {eventBoundary && <a href={donationDetailHref(id, returnFilters) + "#payment-events-heading"}>Newest payment events</a>}
          {history.older && <a href={donationDetailHref(id, returnFilters, history.older) + "#payment-events-heading"}>Older payment events</a>}
        </nav>}</>}
        {canReconcile ? <AdminActionFeedbackForm action={reissueReceiptLinkAction} className="form-grid">
          <input type="hidden" name="donationId" value={donation.id} />
          <div className="field full"><h2>Private acknowledgement link</h2><p className="muted">If a donor lost their link, reissue it. The old link stops working immediately. Send the new one only through a channel you have verified for this donor, such as the phone number or email on this record.</p></div>
          <div className="field full"><label htmlFor="reissue-reason">Reason (kept in the audit trail)</label><textarea id="reissue-reason" name="reason" minLength={3} maxLength={300} required /></div>
          <div className="field full"><button className="button" type="submit">Reissue private link</button></div>
        </AdminActionFeedbackForm> : null}
      </aside>
    </div>
  </>;
}
