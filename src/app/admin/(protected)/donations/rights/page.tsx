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
export default async function DonorRightsQueuePage() {
  await requirePermission("donation.reconcile");
  const enabled = donorRightsEnabled();
  const requests = enabled ? await prisma.donorRightsRequest.findMany({
    where: { status: { in: ["OPEN", "IN_REVIEW"] } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 40,
    select: {
      id: true, kind: true, status: true, createdAt: true,
      donation: { select: { id: true, referenceNumber: true } },
    },
  }) : [];
  return <section className="admin-card">
    <div className="admin-heading"><div>
      <p className="eyebrow">Privacy and donor trust</p>
      <h1>Donation-specific data requests</h1>
      <p className="muted">Only a private receipt holder can start a request about that donation. This queue never exports or erases financial records by itself. Accounting, legal retention and identity verification may require separate review.</p>
    </div></div>
    {!enabled && <p role="status">This optional workflow is disabled until database migration and privacy approval.</p>}
    {requests.length === 0 ? <p className="empty-state">No open requests are awaiting staff review.</p>
      : <ol className="history">{requests.map(request => (
        <li key={request.id}><strong>{DONOR_RIGHTS_LABELS[request.kind]}</strong>
          <span>Status: {request.status} · Received: {request.createdAt.toLocaleString("en-IN")}</span>
          <Link href={`/admin/donations/${request.donation.id}`}>Private donation reference: {request.donation.referenceNumber}</Link>
          <AdminDonorRightsReview requestId={request.id} status={request.status}/>
        </li>
      ))}</ol>}
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
