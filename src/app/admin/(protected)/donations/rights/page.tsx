import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { donorRightsEnabled } from "@/lib/donor-rights-repository";
import { DONOR_RIGHTS_LABELS, DONOR_RIGHTS_KINDS, DONOR_RIGHTS_REVIEW_OUTCOMES, isDonorRightsKind, isDonorRightsReviewOutcome } from "@/lib/donor-rights";
import { AdminDonorRightsReview } from "@/components/admin-donor-rights-review";

export const metadata: Metadata = { title: "Private Donor Requests", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Staff-only request queue; the frontend never displays full donor contact,
 * private receipt credentials, bank details or raw personal documents. */
export default async function DonorRightsQueuePage({ searchParams }: {
  searchParams: Promise<{ queue?: string; after?: string; kind?: string }>;
}) {
  await requirePermission("donation.reconcile");
  const enabled = donorRightsEnabled();
  const params = await searchParams;
  const closed = params.queue === "closed";
  const kind = isDonorRightsKind(params.kind) ? params.kind : undefined;
  const after = typeof params.after === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(params.after)
    ? params.after : undefined;
  const where: Prisma.DonorRightsRequestWhereInput = {
    ...(closed ? { status: "CLOSED" as const } : { status: { in: ["OPEN", "IN_REVIEW"] } }),
    ...(kind ? { kind } : {}),
  };
  const [rows, total] = enabled ? await Promise.all([prisma.donorRightsRequest.findMany({
    where,
    orderBy: closed
      ? [{ reviewedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "asc" }, { id: "asc" }],
    take: 41,
    cursor: after ? { id: after } : undefined,
    skip: after ? 1 : undefined,
    select: {
      id: true, kind: true, status: true, createdAt: true, reviewedAt: true,
      donation: { select: { id: true, referenceNumber: true } },
    },
  }), prisma.donorRightsRequest.count({ where })]) : [[], 0];
  const requests = rows.slice(0, 40);
  // A successful close writes one immutable event in the same transaction.
  // Bound legacy/duplicate audit rows too; absent evidence stays explicitly unknown.
  const closedIds = requests.filter(request => request.status === "CLOSED").map(request => request.id);
  const events = closedIds.length ? await prisma.auditEvent.findMany({
    where: { entityType: "DonorRightsRequest", action: "DONOR_RIGHTS_REVIEW_CLOSED", entityId: { in: closedIds } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 80,
    select: { entityId: true, metadata: true },
  }) : [];
  const outcomes = new Map<string, string>();
  for (const event of events) {
    if (outcomes.has(event.entityId)) continue;
    const metadata = event.metadata;
    const value = metadata && typeof metadata === "object" && !Array.isArray(metadata)
      && metadata.resultingStatus === "CLOSED" ? metadata.reviewOutcome : null;
    outcomes.set(event.entityId, isDonorRightsReviewOutcome(value)
      ? DONOR_RIGHTS_REVIEW_OUTCOMES.find(outcome => outcome.id === value)!.label
      : "Recorded outcome unavailable; consult the private review record.");
  }
  const queueUrl = (queueClosed: boolean, cursor?: string) => {
    const query = new URLSearchParams();
    if (queueClosed) query.set("queue", "closed");
    if (kind) query.set("kind", kind);
    if (cursor) query.set("after", cursor);
    return `/admin/donations/rights${query.size ? `?${query}` : ""}`;
  };
  const base = queueUrl(closed);
  const last = requests.at(-1);
  return <section className="admin-card">
    <div className="admin-heading"><div>
      <p className="eyebrow">Privacy and donor trust</p>
      <h1>Donation-specific data requests</h1>
      <p className="muted">Only a private receipt holder can start a request about that donation. This queue never exports or erases financial records by itself. Accounting, legal retention and identity verification may require separate review.</p>
    </div></div>
    {!enabled && <p role="status">This optional workflow is disabled until database migration and privacy approval.</p>}
    {enabled && <>
      <nav aria-label="Donor request queues">
        <Link href={queueUrl(false)} aria-current={!closed ? "page" : undefined}>Active requests</Link>{" · "}
        <Link href={queueUrl(true)} aria-current={closed ? "page" : undefined}>Closed reviews</Link>
      </nav>
      <form action="/admin/donations/rights" method="get">
        {closed && <input type="hidden" name="queue" value="closed"/>}
        <label className="field">Request type
          <select name="kind" defaultValue={kind ?? ""}>
            <option value="">All request types</option>
            {DONOR_RIGHTS_KINDS.map(value => <option key={value} value={value}>{DONOR_RIGHTS_LABELS[value]}</option>)}
          </select>
        </label>
        <button type="submit" className="button">Filter requests</button>
      </form>
      <p role="status">{total} {closed ? "closed" : "active"} requests recorded; showing {requests.length} on this page.</p>
    </>}
    {enabled && (requests.length === 0 ? <p className="empty-state">{after ? "No requests on this page. Return to the start of this queue." : closed ? "No closed reviews are recorded." : "No open requests are awaiting staff review."}</p>
      : <ol className="history">{requests.map(request => (
        <li key={request.id}><strong>{DONOR_RIGHTS_LABELS[request.kind]}</strong>
          <span>Status: {request.status} · Received: {request.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span>
          {request.status === "CLOSED" && <>
            <span>{request.reviewedAt ? `Closed: ${request.reviewedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : "Closure time unavailable in this record."}</span>
            <span>{outcomes.get(request.id) ?? "Recorded outcome unavailable; consult the private review record."}</span>
          </>}
          <Link href={`/admin/donations/${request.donation.id}`}>Private donation reference: {request.donation.referenceNumber}</Link>
          {(request.status === "OPEN" || request.status === "IN_REVIEW") &&
            <AdminDonorRightsReview requestId={request.id} status={request.status}/>}
        </li>
      ))}</ol>)}
    {enabled && <nav aria-label="Donor request pages">
      {after && <Link href={base}>Start of {closed ? "closed" : "active"} requests</Link>}{" "}
      {rows.length > 40 && last && <Link href={queueUrl(closed, last.id)}>Next requests →</Link>}
    </nav>}
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
