import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

const formatDateTime = (value: Date | null) => value ? value.toLocaleString("en-IN") : "Not recorded";

export default async function DonationDetailPage({ params }: Props) {
  await requirePermission("donation.view");
  const { id } = await params;
  const donation = await prisma.donation.findUnique({
    where: { id },
    include: { appeal: true, events: { orderBy: { processedAt: "desc" } } },
  });
  if (!donation) notFound();

  const refundedAmount = donation.refundedAmount.toNumber();
  const amount = donation.amount.toNumber();
  const netRetained = Math.max(0, amount - refundedAmount);

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">{donation.referenceNumber}</p>
        <h1>{formatINR(amount)}</h1>
        <p className="muted">{donation.appeal.title}</p>
      </div>
      <span className="status-badge">{donation.status}</span>
    </div>
    <div className="admin-detail-grid">
      <section className="card">
        <h2>Donation record</h2>
        <dl className="details">
          <div><dt>Donor</dt><dd>{donation.donorName}</dd></div>
          <div><dt>Public anonymity</dt><dd>{donation.isAnonymous ? "Anonymous" : "Name may be shown"}</dd></div>
          <div><dt>Email</dt><dd>{donation.donorEmail}</dd></div>
          <div><dt>Phone</dt><dd>{donation.donorPhone ?? "Not supplied"}</dd></div>
          <div><dt>Razorpay order</dt><dd>{donation.providerOrderId}</dd></div>
          <div><dt>Razorpay payment</dt><dd>{donation.providerPaymentId ?? "Pending"}</dd></div>
          <div><dt>Acknowledgement</dt><dd>{donation.receiptNumber ?? "Pending"}</dd></div>
          <div><dt>Gross amount</dt><dd>{formatINR(amount)}</dd></div>
          <div><dt>Refunded</dt><dd>{formatINR(refundedAmount)}</dd></div>
          <div><dt>Net retained</dt><dd>{formatINR(netRetained)}</dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(donation.createdAt)}</dd></div>
          <div><dt>Captured</dt><dd>{formatDateTime(donation.capturedAt)}</dd></div>
          <div><dt>Failed</dt><dd>{formatDateTime(donation.failedAt)}</dd></div>
          <div><dt>Fully refunded</dt><dd>{formatDateTime(donation.refundedAt)}</dd></div>
        </dl>
      </section>
      <aside className="card">
        <h2>Payment events</h2>
        {donation.events.length ? <ol className="history">{donation.events.map(event => <li key={event.id}>
          <strong>{event.eventType}</strong>
          <span>{event.processedAt.toLocaleString("en-IN")}</span>
          <small>{event.providerEventId}</small>
        </li>)}</ol> : <p className="muted">No webhook events recorded yet.</p>}
      </aside>
    </div>
  </>;
}
