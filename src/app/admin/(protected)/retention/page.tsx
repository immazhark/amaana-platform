import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewDocumentRetention } from "./actions";

type EventMetadata = { documentId?: string; decision?: string; reason?: string; reviewAfter?: string | null };

export default async function RetentionReviewPage() {
  await requirePermission("assistance.approve");

  const [documents, events] = await Promise.all([
    prisma.assistanceDocument.findMany({
      include: {
        assistanceRequest: {
          select: {
            id: true,
            referenceNumber: true,
            applicantName: true,
            status: true,
            createdAt: true,
            appeal: { select: { status: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditEvent.findMany({
      where: {
        entityType: "AssistanceRequest",
        action: { in: [
          "assistance.document_retention_reviewed",
          "assistance.document_legal_hold_placed",
          "assistance.document_legal_hold_released",
          "assistance.document_deleted",
        ] },
      },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const documentEvents = new Map<string, typeof events>();
  for (const event of events) {
    const metadata = (event.metadata ?? {}) as EventMetadata;
    if (!metadata.documentId) continue;
    const current = documentEvents.get(metadata.documentId) ?? [];
    current.push(event);
    documentEvents.set(metadata.documentId, current);
  }

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Data minimisation</p><h1>Retention review</h1><p className="lead">Review private beneficiary evidence after its operational purpose changes. No fixed deletion period is applied until Amaana&apos;s CA/legal/safeguarding retention schedules are confirmed.</p></div><span className="status-badge">{documents.length} private files</span></div>

    <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <h2>Retention rules applied here</h2>
      <div className="admin-media-readiness">
        <div><strong>Authorised review only</strong><small>Retention decisions require assistance approval permission and are written to the audit trail.</small></div>
        <div><strong>Holds override deletion</strong><small>Legal, audit, investigation or safeguarding holds must be released before a file can be deleted.</small></div>
        <div><strong>No invented timetable</strong><small>Review dates may be scheduled internally, but this screen does not claim a statutory retention period that has not been professionally confirmed.</small></div>
      </div>
    </section>

    <section className="admin-card">
      <div className="admin-heading"><div><p className="eyebrow">Private evidence</p><h2>Assistance documents</h2></div></div>
      {documents.length === 0 ? <p className="empty-state">No private assistance documents are currently stored.</p> : <div className="admin-media-list">{documents.map(document => {
        const history = documentEvents.get(document.id) ?? [];
        const latestHoldEvent = history.find(event => ["assistance.document_legal_hold_placed", "assistance.document_legal_hold_released"].includes(event.action));
        const held = latestHoldEvent?.action === "assistance.document_legal_hold_placed";
        const latestReview = history.find(event => event.action === "assistance.document_retention_reviewed");
        const reviewMeta = (latestReview?.metadata ?? {}) as EventMetadata;
        const terminal = ["CLOSED", "REJECTED"].includes(document.assistanceRequest.status) || document.assistanceRequest.appeal?.status === "CLOSED";

        return <article className="admin-media-item" key={document.id}>
          <div className="admin-media-summary">
            <div><span className="status-badge">{held ? "HOLD" : terminal ? "REVIEW ELIGIBLE" : "ACTIVE CASE"}</span><small>{document.mimeType} · {(document.sizeBytes / 1048576).toFixed(2)} MB</small></div>
            <h3>{document.originalName}</h3>
            <p><Link href={`/admin/requests/${document.assistanceRequestId}`}>{document.assistanceRequest.referenceNumber} · {document.assistanceRequest.applicantName}</Link></p>
            <small>Request status: {document.assistanceRequest.status.replaceAll("_", " ")}{document.assistanceRequest.appeal ? ` · linked appeal ${document.assistanceRequest.appeal.status}` : ""}</small>
            <div style={{ marginTop: "0.75rem" }}><a href={`/admin/documents/${document.id}`} target="_blank" rel="noreferrer">Open private document ↗</a></div>
            {latestReview && <div className="admin-media-review-summary"><strong>Last retention review</strong><small>{latestReview.actor.name} · {latestReview.createdAt.toLocaleString("en-IN")} · {reviewMeta.reason ?? "Reason recorded"}{reviewMeta.reviewAfter ? ` · review after ${new Date(reviewMeta.reviewAfter).toLocaleDateString("en-IN")}` : ""}</small></div>}
            {held && latestHoldEvent && <div className="admin-media-review-summary"><strong>Deletion suspended by hold</strong><small>Placed by {latestHoldEvent.actor.name} on {latestHoldEvent.createdAt.toLocaleString("en-IN")}.</small></div>}
          </div>

          <form action={reviewDocumentRetention} className="form-grid admin-media-edit">
            <input type="hidden" name="documentId" value={document.id}/>
            <div className="field"><label>Decision</label><select name="decision" required defaultValue="RETAIN"><option value="RETAIN">Retain and review later</option>{held ? <option value="RELEASE_HOLD">Release legal/audit/safeguarding hold</option> : <option value="PLACE_HOLD">Place legal/audit/safeguarding hold</option>}<option value="DELETE">Permanently delete raw evidence</option></select></div>
            <div className="field"><label>Review again after <span className="muted">optional</span></label><input type="date" name="reviewAfter"/></div>
            <div className="field full"><label>Reason</label><textarea name="reason" required maxLength={2000} placeholder="Why the file is still needed, why a hold applies, why a hold can be released, or why deletion is now appropriate."/></div>
            <div className="field full"><button className="button secondary" type="submit">Record retention decision</button><small>{terminal ? "Deletion is technically eligible if no hold applies, but the reviewer remains responsible for confirming audit/accounting/safeguarding needs first." : "Deletion is blocked while the case/linked appeal is still active; retain or place a hold instead."}</small></div>
          </form>
        </article>;
      })}</div>}
    </section>
  </>;
}
