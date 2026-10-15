import Link from "@/components/navigation-link";
import type { Metadata } from "next";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocationPlanningEnabled } from "@/lib/allocation-proposal-operations";
import { AdminAllocationReview } from "@/components/admin-allocation-review";
import { AdminAllocationReversal } from "@/components/admin-allocation-reversal";

export const metadata: Metadata = { title: "Internal Allocation Proposals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

export default async function AllocationAdminPage() {
  const staff = await requirePermission("donation.view");
  const enabled = allocationPlanningEnabled();
  const canReview = hasPermission(staff, "fund.approve");
  const rows = enabled ? await prisma.donationAllocationProposal.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 80,
    include: {
      createdBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      reversal: { select: { id: true, createdAt: true } },
      donation: { select: { id: true, referenceNumber: true, status: true, refundedAmount: true } },
      fund: { select: { name: true, accountCode: true } },
    },
  }) : [];
  return <section className="admin-card">
    <div className="admin-heading">
      <div><p className="eyebrow">Finance governance · internal only</p>
        <h1>Allocation proposals</h1>
        <p className="muted">Review planned use of domestic giving-fund donations against the original donor designation. This workflow does not create expenses, transfer funds or mark beneficiaries served.</p>
      </div>
    </div>
    {!enabled && <p role="status">Allocation planning is disabled until migration, finance review and a release decision.</p>}
    {!rows.length && <p className="muted">No internal allocation proposals are recorded.</p>}
    {rows.length > 0 && <ol className="history">{rows.map(item => <li key={item.id}>
      <strong>{money(item.amountPaise)} · {item.status}</strong>
      <span>Restricted fund: {item.fund.name} ({item.fund.accountCode}) · {item.givingIntent}</span>
      <span>Planned purpose: {item.purposeNote}</span>
      <span>Maker: {item.createdBy.name} · {item.createdAt.toLocaleDateString("en-IN")}</span>
      <Link href={`/admin/donations/${item.donation.id}`}>Private donation reference: {item.donation.referenceNumber}</Link>
      {item.reviewedBy && <span>Reviewed by: {item.reviewedBy.name}</span>}
      {item.status === "APPROVED" && !item.reversal &&
        (item.donation.status !== "CAPTURED" || item.donation.refundedAmount.toNumber() > 0) && (
          <p role="alert">The source donation was refunded or changed after this internal approval.
            Stop treating this allocation as retained cash. Escalate for finance reconciliation;
            this screen does not issue a refund or alter the original approval.</p>
        )}

      {item.reversal && <p role="status">Reversed on {item.reversal.createdAt.toLocaleDateString("en-IN")}. Original approval remains in the ledger.</p>}
      {item.status === "APPROVED" && !item.reversal && canReview &&
        item.createdBy.id !== staff.id && item.reviewedBy?.id !== staff.id &&
        <AdminAllocationReversal proposalId={item.id}/>}

      {item.status === "PENDING" && canReview && item.createdBy.id !== staff.id && (
        <AdminAllocationReview proposalId={item.id}/>
      )}
      {item.status === "PENDING" && item.createdBy.id === staff.id && <p className="muted">You created this proposal. A different authorized reviewer must decide.</p>}
    </li>)}</ol>}
    {rows.length === 80 && <p className="muted">Showing the newest 80 proposals. Older records remain in the database audit history.</p>}
    <p><Link href="/admin/giving-funds">Giving funds registry →</Link></p>
  </section>;
}
