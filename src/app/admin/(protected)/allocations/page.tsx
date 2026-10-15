import Link from "@/components/navigation-link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocationPlanningEnabled } from "@/lib/allocation-proposal-operations";
import { assessAllocationBalance } from "@/lib/allocation-finance-reconciliation";
import { assessAllocationPurpose } from "@/lib/allocation-proposals";
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
} satisfies Prisma.DonationAllocationProposalInclude;

type QueueParams = { pendingAfter?: string; conflictsAfter?: string; historyAfter?: string };
const queueKeys = ["pendingAfter", "conflictsAfter", "historyAfter"] as const;

// Only bounded internal row identities may enter Prisma's seek cursor.
function readCursor(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value) ? value : undefined;
}

export default async function AllocationAdminPage({ searchParams }: {
  searchParams: Promise<QueueParams>;
}) {
  const staff = await requirePermission("donation.view");
  const enabled = allocationPlanningEnabled();
  const canReview = hasPermission(staff, "fund.approve");

  const raw = await searchParams;
  const cursors = Object.fromEntries(queueKeys.map(key => [key, readCursor(raw[key])]));
  const seek = (key: typeof queueKeys[number]): Pick<Prisma.DonationAllocationProposalFindManyArgs, "cursor" | "skip"> => {
    const id = cursors[key];
    return id ? { cursor: { id }, skip: 1 } : {};
  };
  function queueLink(key: typeof queueKeys[number], after?: string) {
    const query = new URLSearchParams();
    for (const other of queueKeys) {
      const value = other === key ? after : cursors[other];
      if (value) query.set(other, value);
    }
    return `/admin/allocations${query.size ? `?${query}` : ""}#${key}`;
  }
  function queueNavigation(key: typeof queueKeys[number], label: string,
    rows: { id: string }[], size: number) {
    return <nav aria-label={`${label} pages`}>
      {cursors[key] && <Link href={queueLink(key)}>Start of {label.toLowerCase()}</Link>}{" "}
      {rows.length > size && <Link href={queueLink(key, rows[size - 1]?.id)}>Next {label.toLowerCase()} →</Link>}
    </nav>;
  }

  // Refund-conflicted historical approvals must not vanish behind the recent
  // reviewed archive. Keep a separate oldest-first finance action queue.
  const refundConflictWhere = {
    status: "APPROVED",
    reversal: { is: null },
    donation: { OR: [{ status: { not: "CAPTURED" } }, { refundedAmount: { gt: 0 } }] },
  } satisfies Prisma.DonationAllocationProposalWhereInput;
  const [pendingRows, conflictRows, reviewedRows, conflictCount] = enabled ? await Promise.all([
    prisma.donationAllocationProposal.findMany({
      where: { status: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 61, ...seek("pendingAfter"), include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.findMany({
      where: refundConflictWhere,
      orderBy: [{ reviewedAt: "asc" }, { id: "asc" }],
      take: 41, ...seek("conflictsAfter"), include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
      take: 41, ...seek("historyAfter"), include: proposalIncludes,
    }),
    prisma.donationAllocationProposal.count({ where: refundConflictWhere }),
  ]) : [[], [], [], 0];

  const pending = pendingRows.slice(0, 60);
  const conflicts = conflictRows.slice(0, 40);
  // History is deliberately independent of the conflict viewport. Removing
  // overlapping rows would make advancing one queue silently hide another.
  const history = reviewedRows.slice(0, 40);
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
    const purpose = assessAllocationPurpose(item.donation, item, activeAmounts);
    const eligibleBalance = purpose.state === "VALID" &&
      purpose.remainingPaise >= item.amountPaise;
    const hasConflict = item.status === "APPROVED" && !item.reversal && health.state !== "CLEAR";
    const hasPurposeConflict = item.status === "APPROVED" && !item.reversal &&
      health.state === "CLEAR" && purpose.state === "REVIEW_REQUIRED";
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
      {hasPurposeConflict && <p role="alert">
        <strong>Original designation review required.</strong>{" "}
        The approved internal plan no longer passes its original giving-fund,
        consent or purpose checks. Check the historical donor designation and
        fund governance privately; do not treat this approval as verified spending.
      </p>}
      {item.status === "PENDING" && !eligibleBalance && <p role="alert">
        This proposal currently fails an original-purpose, confirmation, approved-fund or retained-balance check.
        It cannot be approved until finance reconciles the donation.
      </p>}
      {item.status === "PENDING" && canReview && item.createdBy.id !== staff.id &&
        <AdminAllocationReview proposalId={item.id} canApprove={canApproveNow}/>}
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
    <section aria-labelledby="allocation-refund-conflicts-title" id="conflictsAfter">
      <h2 id="allocation-refund-conflicts-title">Urgent refund and status reconciliation</h2>
      <p className="muted">Approved internal allocation proposals linked to later-refunded
        or no-longer-captured donations. These are unresolved planning conflicts,
        not verified expenditure or a reason to change provider payment records.</p>
      {conflicts.length > 0 ? <ol className="history">{conflicts.map(proposalRow)}</ol> :
        <p className="muted">No known post-approval refund or status conflicts in the recorded proposals.</p>}
      {conflictCount > conflicts.length && <p role="alert">
        {conflictCount} unresolved refund/status conflicts are recorded in total;
        this page shows {conflicts.length}. Use the queue links to review further records.
        An incomplete queue is not financial clearance.
      </p>}
      {queueNavigation("conflictsAfter", "Refund conflicts", conflictRows, 40)}
    </section>
    <section aria-labelledby="allocations-pending-title" id="pendingAfter">
      <h2 id="allocations-pending-title">Pending independent review</h2>
      {!pending.length ? <p className="muted">No pending internal allocation proposals.</p>
        : <ol className="history">{pending.map(proposalRow)}</ol>}
      {queueNavigation("pendingAfter", "Pending reviews", pendingRows, 60)}
    </section>
    <section aria-labelledby="allocations-history-title" id="historyAfter">
      <h2 id="allocations-history-title">Recent reviewed proposals</h2>
      {!history.length ? <p className="muted">No reviewed proposals on this page.</p>
        : <ol className="history">{history.map(proposalRow)}</ol>}
      {queueNavigation("historyAfter", "Reviewed proposals", reviewedRows, 40)}
    </section>
    <p><Link href="/admin/giving-funds">Giving funds registry →</Link></p>
  </section>;
}
