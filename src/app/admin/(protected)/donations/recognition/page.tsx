import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { donorRecognitionEnabled } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";
import { AdminRecognitionReview } from "@/components/admin-recognition-review";

export const metadata: Metadata = { title: "Donor Recognition Review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RecognitionReviewPage() {
  await requirePermission("donation.reconcile");
  const requests = donorRecognitionEnabled() ? await prisma.donation.findMany({
    where: {
      status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
      recognitionRequestedAt: { not: null }, recognitionApprovedAt: null,
      recognitionRevokedAt: null, recognitionDisplayName: { not: null },
    },
    orderBy: [{ recognitionRequestedAt: "asc" }, { id: "asc" }],
    take: 30,
    select: {
      id: true, referenceNumber: true, recognitionDisplayName: true,
      recognitionRequestedAt: true,
    },
  }) : [];
  return <section className="admin-card">
    <div className="admin-heading"><div><p className="eyebrow">Private moderation</p>
      <h1>Donor Shukr recognition requests</h1>
      <p className="muted">Never infer consent from a payment, a donor name or the public anonymity setting. Only explicitly requested names are eligible for separate moderation.</p>
    </div></div>
    {!donorRecognitionEnabled() && <p role="status">Recognition is disabled until the consent migration and owner review are complete.</p>}
    {requests.length === 0 ? <p className="empty-state">No pending recognition requests.</p>
      : <ol className="history">{requests.map(request => {
        const name = parseDonorRecognitionName(request.recognitionDisplayName);
        if (!name || !request.recognitionRequestedAt) return null;
        return <li key={request.id}><strong>{name}</strong>
          <span>Private reference: {request.referenceNumber} · requested {request.recognitionRequestedAt.toLocaleDateString("en-IN")}</span>
          <AdminRecognitionReview donationId={request.id} requestedAt={request.recognitionRequestedAt.toISOString()} displayName={name}/>
        </li>;
      })}</ol>}
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
