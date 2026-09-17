import Link from "next/link";
import { DonationStatus } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function DonationsPage({ searchParams }: Props) {
  await requirePermission("donation.view");
  const { status } = await searchParams;
  const selected = Object.values(DonationStatus).includes(status as DonationStatus)
    ? status as DonationStatus
    : undefined;

  const [donations, reconciliation] = await Promise.all([
    prisma.donation.findMany({
      where: selected ? { status: selected } : undefined,
      include: { appeal: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.donation.aggregate({
      where: { status: { in: ["CAPTURED", "REFUNDED"] } },
      _sum: { amount: true, refundedAmount: true },
    }),
  ]);

  const grossCaptured = reconciliation._sum.amount?.toNumber() ?? 0;
  const refunded = reconciliation._sum.refundedAmount?.toNumber() ?? 0;
  const netRetained = Math.max(0, grossCaptured - refunded);

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
    <div className="filter-row">
      <Link href="/admin/donations">All</Link>
      {Object.values(DonationStatus).map(item => <Link key={item} href={`/admin/donations?status=${item}`}>{item}</Link>)}
    </div>
    <div className="admin-table-wrap">
      <table>
        <thead><tr><th>Reference</th><th>Donor</th><th>Appeal</th><th>Amount</th><th>Refunded</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>{donations.map(donation => <tr key={donation.id}>
          <td><Link href={`/admin/donations/${donation.id}`}><strong>{donation.referenceNumber}</strong></Link></td>
          <td>{donation.donorName}<br/><small>{donation.donorEmail}</small></td>
          <td>{donation.appeal.title}</td>
          <td>{formatINR(donation.amount.toNumber())}</td>
          <td>{formatINR(donation.refundedAmount.toNumber())}</td>
          <td><span className="status-badge">{donation.status}</span></td>
          <td>{donation.createdAt.toLocaleDateString("en-IN")}</td>
        </tr>)}</tbody>
      </table>
      {donations.length === 0 && <p className="empty-state">No donations match this view.</p>}
    </div>
  </>;
}
