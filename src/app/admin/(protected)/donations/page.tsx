import Link from "next/link";
import { DonationStatus } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { donationIntentLabel } from "@/lib/donation-intent";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function DonationsPage({ searchParams }: Props) {
  await requirePermission("donation.view");
  const { status, page: pageParam } = await searchParams;
  const selected = Object.values(DonationStatus).includes(status as DonationStatus)
    ? status as DonationStatus
    : undefined;
  const where = selected ? { status: selected } : undefined;

  const [totalItems, reconciliation, unmatchedCriticalEvents] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.aggregate({
      where: { status: { in: ["CAPTURED", "REFUNDED"] } },
      _sum: { amount: true, refundedAmount: true },
    }),
    prisma.paymentEvent.findMany({
      where: {
        donationId: null,
        eventType: { in: ["payment.captured", "payment.failed", "refund.processed"] },
      },
      orderBy: { processedAt: "desc" },
      take: 10,
      select: {
        id: true,
        providerEventId: true,
        eventType: true,
        processedAt: true,
      },
    }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const donations = await prisma.donation.findMany({
    where,
    include: { appeal: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const grossCaptured = reconciliation._sum.amount?.toNumber() ?? 0;
  const refunded = reconciliation._sum.refundedAmount?.toNumber() ?? 0;
  const netRetained = Math.max(0, grossCaptured - refunded);
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/donations",
    query: { ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Reconciliation</p>
        <h1>Donations</h1>
        <p className="lead">
          Gross captured: {formatINR(grossCaptured)} · Refunded: {formatINR(refunded)} · Net retained: {formatINR(netRetained)}
        </p>
      </div>
    </div>
    {unmatchedCriticalEvents.length > 0 && <section className="admin-card" style={{ marginBottom: "1.25rem" }}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Reconciliation attention</p>
          <h2>Unmatched payment events</h2>
          <p className="muted">Critical Razorpay events were received without a linked local donation. Review these before relying on payment totals.</p>
        </div>
        <span className="status-badge">{unmatchedCriticalEvents.length} shown</span>
      </div>
      <ol className="history">
        {unmatchedCriticalEvents.map(event => <li key={event.id}>
          <strong>{event.eventType}</strong>
          <span>{event.processedAt.toLocaleString("en-IN")}</span>
          <small>{event.providerEventId}</small>
        </li>)}
      </ol>
    </section>}
    <div className="filter-row">
      <Link href="/admin/donations">All</Link>
      {Object.values(DonationStatus).map(item => <Link key={item} href={`/admin/donations?status=${item}`}>{item}</Link>)}
    </div>
    <div className="admin-table-wrap">
      <table>
        <thead><tr><th>Reference</th><th>Donor</th><th>Appeal</th><th>Intent</th><th>Amount</th><th>Refunded</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>{donations.map(donation => <tr key={donation.id}>
          <td><Link href={`/admin/donations/${donation.id}`}><strong>{donation.referenceNumber}</strong></Link></td>
          <td>{donation.donorName}<br/><small>{donation.donorEmail}</small></td>
          <td>{donation.appeal.title}</td>
          <td>{donationIntentLabel(donation.givingIntent)}</td>
          <td>{formatINR(donation.amount.toNumber())}</td>
          <td>{formatINR(donation.refundedAmount.toNumber())}</td>
          <td><span className="status-badge">{donation.status}</span></td>
          <td>{donation.createdAt.toLocaleDateString("en-IN")}</td>
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
