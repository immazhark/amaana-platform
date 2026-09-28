import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { donationIntentLabel } from "@/lib/donation-intent";
import { prisma } from "@/lib/prisma";
import { getDonationEvidenceUrl } from "@/lib/storage";
import { reconcileDonationAction } from "../actions";

type Props = { params: Promise<{ id: string }> };
const formatDateTime = (value: Date | null) => value ? value.toLocaleString("en-IN") : "Not recorded";
const methodLabel = (value: string) => value === "DIRECT_UPI" ? "Direct UPI" : value === "BANK_TRANSFER" ? "Bank transfer" : "Razorpay";

export default async function DonationDetailPage({ params }: Props) {
  const user = await requirePermission("donation.view");
  const { id } = await params;
  const donation = await prisma.donation.findUnique({ where: { id }, include: { appeal: true, events: { orderBy: [{ processedAt: "desc" }, { id: "desc" }] }, reconciledBy: { select: { name: true } } } });
  if (!donation) notFound();
  const canReconcile = hasPermission(user, "donation.reconcile");
  const evidenceUrl = donation.transferEvidenceKey ? await getDonationEvidenceUrl(donation.transferEvidenceKey, donation.id) : null;
  const refundedAmount = donation.refundedAmount.toNumber();
  const amount = donation.amount.toNumber();
  const netRetained = Math.max(0, amount - refundedAmount);
  const direct = donation.paymentMethod !== "RAZORPAY";

  return <>
    <div className="admin-heading"><div><p className="eyebrow">{donation.referenceNumber}</p><h1>{formatINR(amount)}</h1><p className="muted">{donation.appeal.title}</p></div><span className="status-badge">{donation.status}</span></div>
    <div className="admin-detail-grid">
      <section className="card"><h2>Donation record</h2><dl className="details">
        <div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Public anonymity</dt><dd>{donation.isAnonymous ? "Anonymous" : "Name may be shown"}</dd></div>
        <div><dt>Email</dt><dd>{donation.donorEmail}</dd></div><div><dt>Phone</dt><dd>{donation.donorPhone ?? "Not supplied"}</dd></div>
        <div><dt>Giving intention</dt><dd>{donationIntentLabel(donation.givingIntent)}</dd></div><div><dt>Payment method</dt><dd>{methodLabel(donation.paymentMethod)}</dd></div>
        {direct ? <><div><dt>Transfer reference / UTR</dt><dd>{donation.transferReference}</dd></div><div><dt>Transfer date</dt><dd>{formatDateTime(donation.transferredAt)}</dd></div><div><dt>Evidence</dt><dd>{evidenceUrl ? <a href={evidenceUrl} target="_blank" rel="noreferrer">Open private evidence</a> : "Not supplied"}</dd></div><div><dt>Reconciled by</dt><dd>{donation.reconciledBy?.name ?? "Pending"}</dd></div><div><dt>Reconciliation notes</dt><dd>{donation.reconciliationNotes ?? "Pending"}</dd></div></> : <><div><dt>Razorpay order</dt><dd>{donation.providerOrderId}</dd></div><div><dt>Razorpay payment</dt><dd>{donation.providerPaymentId ?? "Pending"}</dd></div></>}
        <div><dt>Acknowledgement</dt><dd>{donation.receiptNumber ?? "Pending"}</dd></div><div><dt>Gross amount</dt><dd>{formatINR(amount)}</dd></div><div><dt>Refunded</dt><dd>{formatINR(refundedAmount)}</dd></div><div><dt>Net retained</dt><dd>{formatINR(netRetained)}</dd></div>
        <div><dt>Created</dt><dd>{formatDateTime(donation.createdAt)}</dd></div><div><dt>Captured</dt><dd>{formatDateTime(donation.capturedAt)}</dd></div><div><dt>Failed</dt><dd>{formatDateTime(donation.failedAt)}</dd></div><div><dt>Fully refunded</dt><dd>{formatDateTime(donation.refundedAt)}</dd></div>
      </dl></section>
      <aside className="card">
        {direct && donation.status === "PENDING_VERIFICATION" ? <><h2>Reconcile transfer</h2><p className="muted">Verify against Amaana's bank/UPI statement before approving. A donor-entered UTR or screenshot is evidence to review, not proof of receipt.</p>{canReconcile ? <form action={reconcileDonationAction} className="form-grid"><input type="hidden" name="donationId" value={donation.id}/><div className="field full"><label htmlFor="notes">Reconciliation notes</label><textarea id="notes" name="notes" minLength={3} maxLength={1000} required /></div><div className="field full"><button className="button" type="submit" name="decision" value="VERIFY">Verify received transfer</button> <button className="text-button" type="submit" name="decision" value="REJECT">Reject claim</button></div></form> : <p className="muted">Your account can view this record but cannot reconcile donations.</p>}</> : <><h2>Payment events</h2>{donation.events.length ? <ol className="history">{donation.events.map(event => <li key={event.id}><strong>{event.eventType}</strong><span>{event.processedAt.toLocaleString("en-IN")}</span><small>{event.providerEventId}</small></li>)}</ol> : <p className="muted">{direct ? "Direct transfers do not generate Razorpay webhook events." : "No webhook events recorded yet."}</p>}</>}
      </aside>
    </div>
  </>;
}
