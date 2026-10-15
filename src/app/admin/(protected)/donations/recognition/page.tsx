import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { donorRecognitionEnabled } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";
import { AdminRecognitionReview } from "@/components/admin-recognition-review";
import { AdminRecognitionUnpublish } from "@/components/admin-recognition-unpublish";

export const metadata: Metadata = { title: "Donor Recognition Review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RecognitionReviewPage() {
  await requirePermission("donation.reconcile");
  const pendingWhere = {
    status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
    recognitionRequestedAt: { not: null }, recognitionApprovedAt: null,
    recognitionRevokedAt: null, recognitionDisplayName: { not: null },
  } as const;
  const approvedWhere = {
    recognitionApprovedAt: { not: null }, recognitionRequestedAt: { not: null },
    recognitionRevokedAt: null, recognitionDisplayName: { not: null },
  } as const;
  const requests = donorRecognitionEnabled() ? await prisma.donation.findMany({
    where: pendingWhere,
    orderBy: [{ recognitionRequestedAt: "asc" }, { id: "asc" }],
    take: 30,
    select: {
      id: true, referenceNumber: true, recognitionDisplayName: true,
      recognitionRequestedAt: true,
    },
  }) : [];
  const active = donorRecognitionEnabled() ? await prisma.donation.findMany({
    where: approvedWhere,
    orderBy: [{ recognitionApprovedAt: "desc" }, { id: "desc" }],
    take: 30,
    select: { id: true, referenceNumber: true, recognitionDisplayName: true,
      recognitionRequestedAt: true, recognitionApprovedAt: true },
  }) : [];
  const [pendingCount, approvedCount] = donorRecognitionEnabled()
    ? await Promise.all([
        prisma.donation.count({ where: pendingWhere }),
        prisma.donation.count({ where: approvedWhere }),
      ]) : [0, 0];
  // Pending requests can become invalid after a donor switches anonymity
  // or their payment is refunded. They must remain visible to authorized
  // staff for irreversible, audited cleanup rather than disappearing from
  // both moderation and takedown queues.
  const ineligiblePendingWhere = {
    recognitionRequestedAt: { not: null },
    recognitionApprovedAt: null,
    recognitionRevokedAt: null,
    recognitionDisplayName: { not: null },
    OR: [{ status: { not: "CAPTURED" } }, { isAnonymous: true },
      { refundedAmount: { gt: 0 } }],
  } as const;
  const [ineligiblePending, ineligiblePendingCount] = donorRecognitionEnabled()
    ? await Promise.all([
        prisma.donation.findMany({
          where: ineligiblePendingWhere,
          orderBy: [{ recognitionRequestedAt: "asc" }, { id: "asc" }],
          take: 30,
          select: { id: true, referenceNumber: true,
            recognitionDisplayName: true, recognitionRequestedAt: true },
        }),
        prisma.donation.count({ where: ineligiblePendingWhere }),
      ])
    : [[], 0];
  // Donor-origin consent actions use a separate minimal audit ledger because
  // staff AuditEvent requires a staff actor. Do not fetch names, emails,
  // receipt credentials, browser data or payment amounts for this timeline.
  const [consentHistory, totalConsentEvents] = donorRecognitionEnabled()
    ? await Promise.all([
        prisma.donorRecognitionConsentEvent.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 50,
          select: { id: true, action: true, createdAt: true, donationId: true,
            donation: { select: { referenceNumber: true } } },
        }),
        prisma.donorRecognitionConsentEvent.count(),
      ])
    : [[], 0];
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
    <section aria-labelledby="ineligible-shukr-title">
      <h2 id="ineligible-shukr-title">Ineligible pending names requiring privacy cleanup</h2>
      <p className="muted">These private requests are no longer eligible for publication
        because the donation status, anonymity preference or refund position changed.
        Staff can remove the stale request without publishing a name or altering payment records.</p>
      {ineligiblePending.length > 0
        ? <ol className="history">{ineligiblePending.map(item => {
            const name = parseDonorRecognitionName(item.recognitionDisplayName);
            if (!name || !item.recognitionRequestedAt) return null;
            return <li key={item.id}><strong>{name}</strong>
              <span>Private reference: {item.referenceNumber}</span>
              <AdminRecognitionUnpublish donationId={item.id} displayName={name}
                requestedAt={item.recognitionRequestedAt.toISOString()} approvedAt={null}/>
            </li>;
          })}</ol>
        : <p className="muted">No ineligible pending recognition names need removal.</p>}
      {ineligiblePendingCount > ineligiblePending.length && <p role="alert">
        {ineligiblePendingCount - ineligiblePending.length} additional ineligible requests
        remain beyond the displayed queue. Complete the private backlog before claiming clearance.
      </p>}
    </section>
    {pendingCount > requests.length && <p role="alert">
      {pendingCount - requests.length} more eligible pending donor recognition
      requests remain beyond the first 30 records. Review the full private queue
      before declaring the backlog cleared.
    </p>}
    <h2>Approved names and emergency unpublication</h2>
    <p className="muted">Staff may immediately unpublish a previously approved display name, including after a refund or privacy complaint. This does not change the donation's financial status.</p>
    {active.length === 0 ? <p className="empty-state">No approved names are awaiting review or removal.</p>
      : <ol className="history">{active.map(item => {
        const name = parseDonorRecognitionName(item.recognitionDisplayName);
        if (!name || !item.recognitionApprovedAt || !item.recognitionRequestedAt) return null;
        return <li key={item.id}><strong>{name}</strong>
          <span>Private reference: {item.referenceNumber} · reviewed {item.recognitionApprovedAt.toLocaleDateString("en-IN")}</span>
          <AdminRecognitionUnpublish donationId={item.id} displayName={name}
            requestedAt={item.recognitionRequestedAt.toISOString()}
            approvedAt={item.recognitionApprovedAt.toISOString()}/>
        </li>;
      })}</ol>}
    {approvedCount > active.length && <p className="muted">
      {approvedCount - active.length} older approved recognition records are not
      shown in this first page. This is not an exhaustive takedown history.
    </p>}
    <section aria-labelledby="recognition-consent-events">
      <h2 id="recognition-consent-events">Private donor consent changes</h2>
      <p className="muted">An append-only, receipt-authorized history of requests and withdrawals.
        This history records no donor display name, amount, email, IP address or receipt token.
        Staff approvals and emergency takedowns remain in the separate authorized audit trail.</p>
      {consentHistory.length > 0
        ? <ol className="history">{consentHistory.map(event => <li key={event.id}>
            <strong>{event.action === "REQUESTED" ? "Recognition requested" :
              event.action === "WITHDRAWN" ? "Recognition withdrawn" : "Unknown consent action"}</strong>
            <span>{event.createdAt.toLocaleDateString("en-IN")}</span>
            <Link href={`/admin/donations/${event.donationId}`}>
              Private donation: {event.donation.referenceNumber}
            </Link>
          </li>)}</ol>
        : <p className="muted">No receipt-authenticated consent changes recorded.</p>}
      {totalConsentEvents > consentHistory.length && <p className="muted">
        Showing {consentHistory.length} of {totalConsentEvents} historical events.
        Older events remain in the private finance retention ledger.</p>}
    </section>
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
