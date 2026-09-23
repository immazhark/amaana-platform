import Link from "next/link";
import { DonationIntent, DonationStatus, Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { donationIntentLabel } from "@/lib/donation-intent";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string; intent?: string; page?: string }> };

export default async function DonationsPage({ searchParams }: Props) {
  await requirePermission("donation.view");
  const { status, intent, page: pageParam } = await searchParams;
  const selected = Object.values(DonationStatus).includes(status as DonationStatus)
    ? status as DonationStatus
    : undefined;
  const selectedIntent = Object.values(DonationIntent).includes(intent as DonationIntent)
    ? intent as DonationIntent
    : undefined;
  const where: Prisma.DonationWhereInput = {
    ...(selected ? { status: selected } : {}),
    ...(selectedIntent ? { givingIntent: selectedIntent } : {}),
  };

  const [totalItems, reconciliation, unmatchedCriticalEventCount, unmatchedCriticalEvents, statusGroups, intentGroups] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.aggregate({
      where: { status: { in: ["CAPTURED", "REFUNDED"] } },
      _sum: { amount: true, refundedAmount: true },
    }),
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
    prisma.donation.groupBy({
      by: ["status"],
      where: selectedIntent ? { givingIntent: selectedIntent } : undefined,
      _count: { _all: true },
    }),
    prisma.donation.groupBy({
      by: ["givingIntent"],
      where: selected ? { status: selected } : undefined,
      _count: { _all: true },
    }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const donations = await prisma.donation.findMany({
    where,
    include: { appeal: { select: { title: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const statusCounts = new Map(statusGroups.map(item => [item.status, item._count._all]));
  const intentCounts = new Map(intentGroups.map(item => [item.givingIntent, item._count._all]));
  const grossCaptured = reconciliation._sum.amount?.toNumber() ?? 0;
  const refunded = reconciliation._sum.refundedAmount?.toNumber() ?? 0;
  const netRetained = Math.max(0, grossCaptured - refunded);
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/donations",
    query: {
      ...(selected ? { status: selected } : {}),
      ...(selectedIntent ? { intent: selectedIntent } : {}),
      page: targetPage,
    },
  });
  const statusHref = (nextStatus?: DonationStatus) => ({
    pathname: "/admin/donations",
    query: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(selectedIntent ? { intent: selectedIntent } : {}),
    },
  });
  const intentHref = (nextIntent?: DonationIntent) => ({
    pathname: "/admin/donations",
    query: {
      ...(selected ? { status: selected } : {}),
      ...(nextIntent ? { intent: nextIntent } : {}),
    },
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
          <p className="muted">Critical Razorpay events were received without a linked local donation. Review these before relying on payment totals. The newest 10 are shown below.</p>
        </div>
        <span className="status-badge">{unmatchedCriticalEventCount} unresolved</span>
      </div>
      <ol className="history">
        {unmatchedCriticalEvents.map(event => <li key={event.id}>
          <strong>{event.eventType}</strong>
          <span>{event.processedAt.toLocaleString("en-IN")}</span>
          <small>{event.providerEventId}</small>
        </li>)}
      </ol>
    </section>}
    <div className="filter-row" aria-label="Donation status filter">
      <strong>Status:</strong>
      <Link href={statusHref()} aria-current={!selected ? "page" : undefined}>All</Link>
      {Object.values(DonationStatus).map(item => <Link key={item} href={statusHref(item)} aria-current={selected === item ? "page" : undefined}>{item} ({statusCounts.get(item) ?? 0})</Link>)}
    </div>
    <div className="filter-row" aria-label="Giving intention filter">
      <strong>Giving intention:</strong>
      <Link href={intentHref()} aria-current={!selectedIntent ? "page" : undefined}>All</Link>
      {Object.values(DonationIntent).map(item => <Link key={item} href={intentHref(item)} aria-current={selectedIntent === item ? "page" : undefined}>{donationIntentLabel(item)} ({intentCounts.get(item) ?? 0})</Link>)}
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
