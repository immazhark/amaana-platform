import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { donorRightsEnabled } from "@/lib/donor-rights-repository";
import { DONOR_RIGHTS_LABELS } from "@/lib/donor-rights";
import { AdminDonorRightsReview } from "@/components/admin-donor-rights-review";

export const metadata: Metadata = { title: "Private Donor Requests", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Staff-only request queue; the frontend never displays full donor contact,
 * private receipt credentials, bank details or raw personal documents. */
export default async function DonorRightsQueuePage({ searchParams }: {
  searchParams: Promise<{ queue?: string; after?: string }>;
}) {
  await requirePermission("donation.reconcile");
  const enabled = donorRightsEnabled();
  const params = await searchParams;
  const closed = params.queue === "closed";
  const after = typeof params.after === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(params.after)
    ? params.after : undefined;
  const where: Prisma.DonorRightsRequestWhereInput = closed
    ? { status: "CLOSED" } : { status: { in: ["OPEN", "IN_REVIEW"] } };
  const [rows, total] = enabled ? await Promise.all([prisma.donorRightsRequest.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 41,
    cursor: after ? { id: after } : undefined,
    skip: after ? 1 : undefined,
    select: {
      id: true, kind: true, status: true, createdAt: true,
      donation: { select: { id: true, referenceNumber: true } },
    },
  }), prisma.donorRightsRequest.count({ where })]) : [[], 0];
  const requests = rows.slice(0, 40);
  const base = `/admin/donations/rights${closed ? "?queue=closed" : ""}`;
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
        <Link href="/admin/donations/rights" aria-current={!closed ? "page" : undefined}>Active requests</Link>{" · "}
        <Link href="/admin/donations/rights?queue=closed" aria-current={closed ? "page" : undefined}>Closed reviews</Link>
      </nav>
      <p role="status">{total} {closed ? "closed" : "active"} requests recorded; showing {requests.length} on this page.</p>
    </>}
    {enabled && (requests.length === 0 ? <p className="empty-state">{after ? "No requests on this page. Return to the start of this queue." : closed ? "No closed reviews are recorded." : "No open requests are awaiting staff review."}</p>
      : <ol className="history">{requests.map(request => (
        <li key={request.id}><strong>{DONOR_RIGHTS_LABELS[request.kind]}</strong>
          <span>Status: {request.status} · Received: {request.createdAt.toLocaleString("en-IN")}</span>
          <Link href={`/admin/donations/${request.donation.id}`}>Private donation reference: {request.donation.referenceNumber}</Link>
          {(request.status === "OPEN" || request.status === "IN_REVIEW") &&
            <AdminDonorRightsReview requestId={request.id} status={request.status}/>}
        </li>
      ))}</ol>)}
    {enabled && <nav aria-label="Donor request pages">
      {after && <Link href={base}>Start of {closed ? "closed" : "active"} requests</Link>}{" "}
      {rows.length > 40 && last && <Link href={`${base}${closed ? "&" : "?"}after=${encodeURIComponent(last.id)}`}>Next requests →</Link>}
    </nav>}
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
