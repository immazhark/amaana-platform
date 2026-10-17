import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "@/components/navigation-link";
import { requirePermission } from "@/lib/auth";
import { getAdminPagination } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";
import { donorRecognitionEnabled } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";
import { AdminRecognitionReview } from "@/components/admin-recognition-review";
import { AdminRecognitionUnpublish } from "@/components/admin-recognition-unpublish";

export const metadata: Metadata = { title: "Donor Recognition Review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type PageKey = "pendingPage" | "approvedPage" | "cleanupPage" | "consentPage";
type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^[1-9]\d{0,8}$/.test(value) ? Number(value) : 1;
}

function QueuePages({ pagination, pages, pageKey, label, anchor }: {
  pagination: ReturnType<typeof getAdminPagination>;
  pages: Record<PageKey, number>; pageKey: PageKey; label: string; anchor: string;
}) {
  const href = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...pages, [pageKey]: page })) {
      if (value > 1) query.set(key, String(value));
    }
    return `/admin/donations/recognition${query.size ? `?${query}` : ""}#${anchor}`;
  };
  return <nav className="filter-row" aria-label={label}>
    {pagination.hasPrevious && <Link href={href(pagination.page - 1)} prefetch={false}>Previous</Link>}
    <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
    {pagination.hasNext && <Link href={href(pagination.page + 1)} prefetch={false}>Next</Link>}
  </nav>;
}

function UnreviewableName({ id, referenceNumber }: { id: string; referenceNumber: string }) {
  return <li><strong>Name requires record review</strong>
    <p>The stored name or consent timestamps cannot be used for this action. Open the private record before proceeding.</p>
    <Link href={`/admin/donations/${id}`}>Private donation reference: {referenceNumber}</Link>
  </li>;
}

export default async function RecognitionReviewPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  await requirePermission("donation.reconcile");
  const heading = <div className="admin-heading"><div><p className="eyebrow">Private moderation</p>
    <h1>Donor Shukr recognition requests</h1>
    <p className="muted">Never infer consent from a payment, a donor name or the public anonymity setting. Only explicitly requested names are eligible for separate moderation.</p>
  </div></div>;
  if (!donorRecognitionEnabled()) return <section className="admin-card">{heading}
    <p role="status">Recognition is disabled until the consent migration and owner review are complete.</p>
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
  const params = await searchParams;
  const pendingWhere = {
    status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
    recognitionRequestedAt: { not: null }, recognitionApprovedAt: null,
    recognitionRevokedAt: null, recognitionDisplayName: { not: null },
  } satisfies Prisma.DonationWhereInput;
  // Approved names remain reachable for takedown after a refund or anonymity
  // change. Publication eligibility must never restrict emergency removal.
  const approvedWhere = {
    recognitionApprovedAt: { not: null }, recognitionRequestedAt: { not: null },
    recognitionRevokedAt: null, recognitionDisplayName: { not: null },
  } satisfies Prisma.DonationWhereInput;
  const ineligiblePendingWhere = {
    recognitionRequestedAt: { not: null }, recognitionApprovedAt: null,
    recognitionRevokedAt: null, recognitionDisplayName: { not: null },
    OR: [{ status: { not: "CAPTURED" } }, { isAnonymous: true }, { refundedAmount: { gt: 0 } }],
  } satisfies Prisma.DonationWhereInput;
  const [pendingCount, approvedCount, ineligiblePendingCount, totalConsentEvents] = await Promise.all([
    prisma.donation.count({ where: pendingWhere }),
    prisma.donation.count({ where: approvedWhere }),
    prisma.donation.count({ where: ineligiblePendingWhere }),
    prisma.donorRecognitionConsentEvent.count(),
  ]);
  // Clamp offsets against current counts before any row read. Queue changes
  // can empty a later page; other queues retain their independently selected page.
  const pending = getAdminPagination(pendingCount, pageNumber(params.pendingPage), 30);
  const approved = getAdminPagination(approvedCount, pageNumber(params.approvedPage), 30);
  const cleanup = getAdminPagination(ineligiblePendingCount, pageNumber(params.cleanupPage), 30);
  const consent = getAdminPagination(totalConsentEvents, pageNumber(params.consentPage), 50);
  const pages = { pendingPage: pending.page, approvedPage: approved.page, cleanupPage: cleanup.page, consentPage: consent.page };
  const [requests, active, ineligiblePending, consentHistory] = await Promise.all([
    prisma.donation.findMany({
      where: pendingWhere, orderBy: [{ recognitionRequestedAt: "asc" }, { id: "asc" }],
      take: pending.pageSize, skip: pending.skip,
      select: { id: true, referenceNumber: true, recognitionDisplayName: true, recognitionRequestedAt: true },
    }),
    prisma.donation.findMany({
      where: approvedWhere, orderBy: [{ recognitionApprovedAt: "desc" }, { id: "desc" }],
      take: approved.pageSize, skip: approved.skip,
      select: { id: true, referenceNumber: true, recognitionDisplayName: true,
        recognitionRequestedAt: true, recognitionApprovedAt: true },
    }),
    prisma.donation.findMany({
      where: ineligiblePendingWhere, orderBy: [{ recognitionRequestedAt: "asc" }, { id: "asc" }],
      take: cleanup.pageSize, skip: cleanup.skip,
      select: { id: true, referenceNumber: true, recognitionDisplayName: true, recognitionRequestedAt: true },
    }),
    // Only event identity, action, time and private reference; no donor names,
    // contacts, receipt credentials, browser metadata or financial amounts.
    prisma.donorRecognitionConsentEvent.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: consent.pageSize, skip: consent.skip,
      select: { id: true, action: true, createdAt: true, donationId: true,
        donation: { select: { referenceNumber: true } } },
    }),
  ]);
  return <section className="admin-card">{heading}
    <nav className="filter-row" aria-label="Recognition review sections">
      <Link href="#pending-recognition">Pending ({pendingCount})</Link>
      <Link href="#ineligible-shukr-title">Privacy cleanup ({ineligiblePendingCount})</Link>
      <Link href="#approved-recognition">Approved ({approvedCount})</Link>
      <Link href="#recognition-consent-events">Consent history ({totalConsentEvents})</Link>
    </nav>
    <section aria-labelledby="pending-recognition">
      <h2 id="pending-recognition">Pending name reviews</h2>
      {requests.length === 0 ? <p className="empty-state">{pendingCount === 0 ? "No pending recognition requests." : "No entries remain on this page. Refresh this queue."}</p>
        : <ol className="history">{requests.map(request => {
          const name = parseDonorRecognitionName(request.recognitionDisplayName);
          if (!name || name !== request.recognitionDisplayName || !request.recognitionRequestedAt) return <UnreviewableName key={request.id} {...request} />;
          return <li key={request.id}><strong>{name}</strong>
            <span>Private reference: {request.referenceNumber} · requested {request.recognitionRequestedAt.toLocaleDateString("en-IN")}</span>
            <AdminRecognitionReview donationId={request.id} requestedAt={request.recognitionRequestedAt.toISOString()} displayName={name}/>
          </li>;
        })}</ol>}
      <QueuePages pagination={pending} pages={pages} pageKey="pendingPage" label="Pending recognition pages" anchor="pending-recognition" />
    </section>
    <section aria-labelledby="ineligible-shukr-title">
      <h2 id="ineligible-shukr-title">Ineligible pending names requiring privacy cleanup</h2>
      <p className="muted">These private requests are no longer eligible for publication because the donation status, anonymity preference or refund position changed. Staff can remove the stale request without publishing a name or altering payment records.</p>
      {ineligiblePending.length > 0 ? <ol className="history">{ineligiblePending.map(item => {
        const name = parseDonorRecognitionName(item.recognitionDisplayName);
        if (!name || name !== item.recognitionDisplayName || !item.recognitionRequestedAt) return <UnreviewableName key={item.id} {...item} />;
        return <li key={item.id}><strong>{name}</strong><span>Private reference: {item.referenceNumber}</span>
          <AdminRecognitionUnpublish donationId={item.id} displayName={name} requestedAt={item.recognitionRequestedAt.toISOString()} approvedAt={null}/>
        </li>;
      })}</ol> : <p className="muted">{ineligiblePendingCount === 0 ? "No ineligible pending recognition names need removal." : "No entries remain on this page. Refresh this queue."}</p>}
      <QueuePages pagination={cleanup} pages={pages} pageKey="cleanupPage" label="Privacy cleanup pages" anchor="ineligible-shukr-title" />
    </section>
    <section aria-labelledby="approved-recognition">
      <h2 id="approved-recognition">Approved names and emergency unpublication</h2>
      <p className="muted">Staff may immediately unpublish a previously approved display name, including after a refund or privacy complaint. This does not change the donation&apos;s financial status.</p>
      {active.length === 0 ? <p className="empty-state">{approvedCount === 0 ? "No approved names are awaiting review or removal." : "No entries remain on this page. Refresh this queue."}</p>
        : <ol className="history">{active.map(item => {
          const name = parseDonorRecognitionName(item.recognitionDisplayName);
          if (!name || name !== item.recognitionDisplayName || !item.recognitionApprovedAt || !item.recognitionRequestedAt) return <UnreviewableName key={item.id} {...item} />;
          return <li key={item.id}><strong>{name}</strong>
            <span>Private reference: {item.referenceNumber} · reviewed {item.recognitionApprovedAt.toLocaleDateString("en-IN")}</span>
            <AdminRecognitionUnpublish donationId={item.id} displayName={name}
              requestedAt={item.recognitionRequestedAt.toISOString()} approvedAt={item.recognitionApprovedAt.toISOString()}/>
          </li>;
        })}</ol>}
      <QueuePages pagination={approved} pages={pages} pageKey="approvedPage" label="Approved recognition pages" anchor="approved-recognition" />
    </section>
    <section aria-labelledby="recognition-consent-events">
      <h2 id="recognition-consent-events">Private donor consent changes</h2>
      <p className="muted">An append-only, receipt-authorized history of requests and withdrawals. This history records no donor display name, amount, email, IP address or receipt token. Staff approvals and emergency takedowns remain in the separate authorized audit trail.</p>
      {consentHistory.length > 0 ? <ol className="history">{consentHistory.map(event => <li key={event.id}>
        <strong>{event.action === "REQUESTED" ? "Recognition requested" : event.action === "WITHDRAWN" ? "Recognition withdrawn" : "Unknown consent action"}</strong>
        <span>{event.createdAt.toLocaleDateString("en-IN")}</span>
        <Link href={`/admin/donations/${event.donationId}`}>Private donation: {event.donation.referenceNumber}</Link>
      </li>)}</ol> : <p className="muted">{totalConsentEvents === 0 ? "No receipt-authenticated consent changes recorded." : "No events remain on this page. Refresh this queue."}</p>}
      <QueuePages pagination={consent} pages={pages} pageKey="consentPage" label="Donor consent history pages" anchor="recognition-consent-events" />
    </section>
    <p><Link href="/admin/donations">Back to private donation records</Link></p>
  </section>;
}
