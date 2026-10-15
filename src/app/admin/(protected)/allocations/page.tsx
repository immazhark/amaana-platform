import Link from "@/components/navigation-link";
import type { Metadata } from "next";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocationPlanningEnabled } from "@/lib/allocation-proposal-operations";
import { assessAllocationBalance } from "@/lib/allocation-finance-reconciliation";
import { allocationAvailablePaise } from "@/lib/allocation-proposals";
import { AdminAllocationReview } from "@/components/admin-allocation-review";
import { AdminAllocationReversal } from "@/components/admin-allocation-reversal";

export const metadata: Metadata = { title: "Internal Allocation Proposals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

// Keep the pending queue separate. A large reviewed archive must never
// displace an actionable pending proposal from the first limited page.
const proposalIncludes = {
  createdBy: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
  reversal: { select: { id: true, createdAt: true } },
  donation: { select: {
    id: true, referenceNumber: true, status: true, currency: true,
    amount: true, refundedAmount: true, fundId: true, appealId: true,
    givingIntent: true, designationSnapshot: true,
    domesticConfirmedAt: true, fundDisclosureConfirmedAt: true,
    fund: { select: { status: true } },
  } },
  fund: { select: { name: true, accountCode: true } },
} as const;

export default async function AllocationAdminPage() {
  const staff = await requirePermission("donation.view");
  const enabled = allocationPlanningEnabled();
  const canReview = hasPermission(staff, "fund.approve");

  // Refund-conflicted historical approvals must not vanish behind the recent
  // reviewed archive. Keep a separate oldest-first finance action queue.
  const refundConflictWhere = {
    status: "APPROVED",
    reversal: { is: null },
    donation: { OR: [{ status: { not: "CAPTURED" } }, { refundedAmount: { gt: 0 } }] },
  } as const;
  const [pending, conflicts, reviewed, conflictCount] = enabled ? await Promise.all([
    prisma.donationAllocationProposal.findMany({
      where: { status: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 60, include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.findMany({
      where: refundConflictWhere,
      orderBy: [{ reviewedAt: "asc" }, { id: "asc" }],
      take: 40, include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
      take: 40, include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.count({ where: refundConflictWhere }),
  ]) : [[], [], [], 0];

  const conflictIds = new Set(conflicts.map(item => item.id));
  const history = reviewed.filter(item => !conflictIds.has(item.id));
  const all = [...pending, ...conflicts, ...history];
  const ids = [...new Set(all.map(item => item.donationId))];
  const approvals = enabled && ids.length > 0
    ? await prisma.donationAllocationProposal.findMany({
        where: { donationId: { in: ids }, status: "APPROVED" },
        select: { donationId: true, amountPaise: true, reversal: { select: { id: true } } },
      }) : [];
  const amounts = new Map<string, Array<{ amountPaise: number; reversed: boolean }>>();
  for (const item of approvals) {
    const existing = amounts.get(item.donationId) ?? [];
    existing.push({ amountPaise: item.amountPaise, reversed: item.reversal !== null });
    amounts.set(item.donationId, existing);
  }

  function proposalRow(item: (typeof all)[number]) {
    const activeAmounts = (amounts.get(item.donationId) ?? [])
      .filter(value => !value.reversed).map(value => value.amountPaise);
    const health = assessAllocationBalance(item.donation, amounts.get(item.donationId) ?? []);
    let eligibleBalance = false;
    try {
      eligibleBalance = item.donation.fund?.status === "APPROVED" &&
        item.donation.fundId === item.fundId &&
        item.donation.givingIntent === item.givingIntent &&
        allocationAvailablePaise(item.donation, activeAmounts) >= item.amountPaise;
    } catch {
      eligibleBalance = false;
    }
    const hasConflict = item.status === "APPROVED" && !item.reversal && health.state !== "CLEAR";
    const canApproveNow = item.status === "PENDING" && eligibleBalance &&
      health.state === "CLEAR" && canReview && item.createdBy.id !== staff.id;

    return <li key={item.id}>
      <strong>{money(item.amountPaise)} · {item.status.replaceAll("_", " ")}</strong>
      <span>Restricted fund: {item.fund.name} ({item.fund.accountCode}) · {item.givingIntent}</span>
      <span>Planned purpose: {item.purposeNote}</span>
      <span>Maker: {item.createdBy.name} · {item.createdAt.toLocaleDateString("en-IN")}</span>
      <Link href={`/admin/donations/${item.donation.id}`}>Private donation reference: {item.donation.referenceNumber}</Link>
      {item.reviewedBy && <span>Reviewed by: {item.reviewedBy.name}</span>}
      {item.reversal && <p role="status">Reversed on {item.reversal.createdAt.toLocaleDateString("en-IN")}. Original approval remains in the ledger.</p>}
      {hasConflict && <p role="alert">
        <strong>Financial reconciliation required.</strong>{" "}
        {health.state === "REFUND_CONFLICT"
          ? "The original donation was refunded or changed after approval."
          : health.state === "OVERALLOCATED"
            ? "Approved internal allocations exceed retained donation funds."
            : "The original donation accounting cannot be validated safely."}{" "}
        Do not treat this planning approval as retained cash or verified disbursement.
      </p>}
      {item.status === "PENDING" && !eligibleBalance && <p role="alert">
        This proposal currently fails an original-purpose, confirmation, approved-fund or retained-balance check.
        It cannot be approved until finance reconciles the donation.
      </p>}
      {canApproveNow && <AdminAllocationReview proposalId={item.id}/>}
      {item.status === "PENDING" && item.createdBy.id === staff.id &&
        <p className="muted">You created this proposal. A separate authorized reviewer must decide.</p>}
      {item.status === "APPROVED" && !item.reversal && canReview &&
        item.createdBy.id !== staff.id && item.reviewedBy?.id !== staff.id &&
        <AdminAllocationReversal proposalId={item.id}/>}
    </li>;
  }

  return <section className="admin-card">
    <div className="admin-heading">
      <div><p className="eyebrow">Finance governance · internal only</p>
        <h1>Allocation proposals</h1>
        <p className="muted">Proposed internal use of verified domestic giving-fund donations.
          This workflow never transfers funds, creates expenses or records beneficiary delivery.</p>
      </div>
    </div>
    {!enabled && <p role="status">Allocation planning remains disabled until migration, finance review and release authorization.</p>}
    <section aria-labelledby="allocation-refund-conflicts-title">
      <h2 id="allocation-refund-conflicts-title">Urgent refund and status reconciliation</h2>
      <p className="muted">Approved internal allocation proposals linked to later-refunded
        or no-longer-captured donations. These are unresolved planning conflicts,
        not verified expenditure or a reason to change provider payment records.</p>
      {conflicts.length > 0 ? <ol className="history">{conflicts.map(proposalRow)}</ol> :
        <p className="muted">No known post-approval refund or status conflicts in the recorded proposals.</p>}
      {conflictCount > conflicts.length && <p role="alert">
        {conflictCount - conflicts.length} more refund/status conflicts remain outside this
        first review page. Continue reconciliation in the complete private ledger;
        do not treat an incomplete queue as financial clearance.
      </p>}
    </section>
    <section aria-labelledby="allocations-pending-title">
      <h2 id="allocations-pending-title">Pending independent review</h2>
      {!pending.length ? <p className="muted">No pending internal allocation proposals.</p>
        : <ol className="history">{pending.map(proposalRow)}</ol>}
      {pending.length === 60 && <p className="muted">Showing the oldest 60 pending requests. Additional pending records remain in the private database.</p>}
    </section>
    <section aria-labelledby="allocations-history-title">
      <h2 id="allocations-history-title">Recent reviewed proposals</h2>
      {!history.length ? <p className="muted">No additional recent reviews outside the reconciliation queue.</p>
        : <ol className="history">{history.map(proposalRow)}</ol>}
      {reviewed.length === 40 && <p className="muted">Showing the most recent 40 reviewed proposals. Earlier decisions remain preserved in the audit history.</p>}
    </section>
    <p><Link href="/admin/giving-funds">Giving funds registry →</Link></p>
  </section>;
}
