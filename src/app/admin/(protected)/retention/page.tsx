import Link from "next/link";
import { AssistanceStatus, AppealStatus, Prisma } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewDocumentRetention } from "./actions";
import { loadRetentionPageEvidence } from "@/lib/retention-page-evidence";
import { logServerError } from "@/lib/server-log";
import { classifyRetentionSchedule, indiaCalendarDay, loadRetentionScheduleSummary, type RetentionSchedule } from "@/lib/retention-review";

const scheduleLabels: Record<RetentionSchedule, string> = {
  due: "Review reminder due", upcoming: "Upcoming review reminder", unreviewed: "No recorded retention decision", unscheduled: "No review date recorded", invalid: "Review date evidence needs checking",
};


type Props = { searchParams: Promise<{ state?: string; page?: string }> };

export default async function RetentionReviewPage({ searchParams }: Props) {
  await requirePermission("assistance.approve");
  const { state, page: pageParam } = await searchParams;
  const selectedState = state === "active" || state === "eligible" ? state : undefined;
  const terminalWhere: Prisma.AssistanceDocumentWhereInput = {
    OR: [
      { assistanceRequest: { status: { in: [AssistanceStatus.CLOSED, AssistanceStatus.REJECTED] } } },
      { assistanceRequest: { appeal: { status: AppealStatus.CLOSED } } },
    ],
  };
  const where: Prisma.AssistanceDocumentWhereInput | undefined = selectedState === "eligible"
    ? terminalWhere
    : selectedState === "active"
      ? { NOT: terminalWhere }
      : undefined;
  const today = indiaCalendarDay(new Date());
  const [totalItems, totalDocuments, eligibleDocuments, schedule] = await Promise.all([
    prisma.assistanceDocument.count({ where }),
    prisma.assistanceDocument.count(),
    prisma.assistanceDocument.count({ where: terminalWhere }),
    loadRetentionScheduleSummary(prisma, today).catch(() => {
      logServerError("retention.schedule_summary_unavailable");
      return null;
    }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const documents = await prisma.assistanceDocument.findMany({
      where,
      select: {
        id: true,
        assistanceRequestId: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
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
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
    });
  const evidence = await loadRetentionPageEvidence(prisma, documents).catch(() => {
    logServerError("retention.page_evidence_unavailable");
    return null;
  });

  const activeDocuments = Math.max(0, totalDocuments - eligibleDocuments);
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/retention",
    query: { ...(selectedState ? { state: selectedState } : {}), page: targetPage },
  });


  return <>
    <div className="admin-heading"><div><p className="eyebrow">Data minimisation</p><h1>Retention review</h1><p className="lead">Review private beneficiary evidence after its operational purpose changes. No fixed deletion period is applied until Amaana&apos;s CA/legal/safeguarding retention schedules are confirmed.</p></div><span className="status-badge">{totalDocuments} private files</span></div>

    <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <h2>Retention rules applied here</h2>
      <div className="admin-media-readiness">
        <div><strong>Authorised review only</strong><small>Retention decisions require assistance approval permission and are written to the audit trail.</small></div>
        <div><strong>Holds override deletion</strong><small>Legal, audit, investigation or safeguarding holds must be released before a file can be deleted.</small></div>
        <div><strong>No invented timetable</strong><small>Review dates may be scheduled internally, but this screen does not claim a statutory retention period that has not been professionally confirmed.</small></div>
      </div>
    </section>

    <section className="admin-card" aria-labelledby="retention-schedule-heading" style={{ marginBottom: "2rem" }}>
      <h2 id="retention-schedule-heading">Retention review reminders</h2>
      <p className="muted">All stored assistance documents, independent of the list filter. Review dates are Indian calendar days. The latest recorded retain or hold decision supplies its reminder, not a statutory deletion deadline. Held documents may also need review; a due reminder never releases a hold or authorises deletion.</p>
      {schedule === null ? <p role="status">Retention reminders temporarily unavailable. The document list remains available for read-only review. Refresh before recording a decision.</p> : <>
      <div className="admin-media-readiness">
        <div><strong>{schedule.due}</strong><small>Review due today or earlier</small></div>
        <div><strong>{schedule.upcoming}</strong><small>Upcoming review date</small></div>
        <div><strong>{schedule.unreviewed}</strong><small>No recorded retention decision</small></div>
        <div><strong>{schedule.unscheduled}</strong><small>Recorded decision without a review date</small></div>
        <div><strong>{schedule.invalid}</strong><small>Invalid review date evidence</small></div>
        <div><strong>{schedule.held}</strong><small>Under hold (overlaps reminder categories)</small></div>
      </div>
      <p className="muted">{schedule.total} documents in the reminder snapshot. Check the reminder beside each file below. The existing list order and filters are unchanged.</p>
      </>}
    </section>

    <section className="admin-card">
      <div className="admin-heading"><div><p className="eyebrow">Private evidence</p><h2>Assistance documents</h2></div><span className="status-badge">{pagination.totalItems} in view</span></div>
      <div className="filter-row" role="group" aria-label="Retention eligibility filter">
        <strong>Workflow state:</strong>
        <Link href="/admin/retention" aria-current={!selectedState ? "page" : undefined}>All ({totalDocuments})</Link>
        <Link href="/admin/retention?state=eligible" aria-current={selectedState === "eligible" ? "page" : undefined}>Review eligible ({eligibleDocuments})</Link>
        <Link href="/admin/retention?state=active" aria-current={selectedState === "active" ? "page" : undefined}>Active case ({activeDocuments})</Link>
      </div>
      {documents.length === 0 ? <p className="empty-state">No private assistance documents match this view.</p> : <div className="admin-media-list">{documents.map(document => {
        const current = evidence?.get(document.id);
        const reviewBlocked = schedule === null || !current || current.conflict;
        const held = current?.holdAction === "assistance.document_legal_hold_placed";
        const reminderDate = current?.decisionAfter;
        const reminder = classifyRetentionSchedule(Boolean(current?.decisionAction), reminderDate, today);
        const terminal = ["CLOSED", "REJECTED"].includes(document.assistanceRequest.status) || document.assistanceRequest.appeal?.status === "CLOSED";
        const fieldPrefix = `retention-${document.id}`;

        return <article className="admin-media-item" key={document.id}>
          <div className="admin-media-summary">
            <div><span className="status-badge">{reviewBlocked ? "REVIEW BLOCKED" : held ? "HOLD" : terminal ? "REVIEW ELIGIBLE" : "ACTIVE CASE"}</span><small>{document.mimeType} · {(document.sizeBytes / 1048576).toFixed(2)} MB</small></div>
            <h3>{document.originalName}</h3>
            <p><Link href={`/admin/requests/${document.assistanceRequestId}`}>{document.assistanceRequest.referenceNumber} · {document.assistanceRequest.applicantName}</Link></p>
            <small>Request status: {document.assistanceRequest.status.replaceAll("_", " ")}{document.assistanceRequest.appeal ? ` · linked appeal ${document.assistanceRequest.appeal.status}` : ""}</small>
            <div style={{ marginTop: "0.75rem" }}><a href={`/admin/documents/${document.id}`} target="_blank" rel="noreferrer">Open private document ↗<span className="sr-only"> (opens in a new tab)</span></a></div>
            {!current || current.conflict ? <p role="status">Retention evidence is unavailable or inconsistent. Refresh or contact an administrator before recording a decision.</p> : <>
              {current.reviewAt && <div className="admin-media-review-summary"><strong>Last retention review</strong><small>{current.reviewActor} · {current.reviewAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {current.reviewReason ?? "Reason recorded"}{typeof current.reviewAfter === "string" && classifyRetentionSchedule(true, current.reviewAfter, today) !== "invalid" ? ` · review after ${new Date(current.reviewAfter).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</small></div>}
              <p><strong>{scheduleLabels[reminder]}</strong>{(reminder === "due" || reminder === "upcoming") && typeof reminderDate === "string" ? ` · ${reminderDate.slice(0, 10)}` : ""}</p>
              {held && current.holdAt && <div className="admin-media-review-summary"><strong>Deletion suspended by hold</strong><small>Placed by {current.holdActor} on {current.holdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.</small></div>}
            </>}
          </div>

          {current && !reviewBlocked && <form action={reviewDocumentRetention} className="form-grid admin-media-edit">
            <input type="hidden" name="documentId" value={document.id}/>
            <input type="hidden" name="expectedHoldAction" value={current.holdAction ?? ""}/>
            <input type="hidden" name="expectedHoldCreatedAt" value={current.holdAt?.toISOString() ?? ""}/>
            <div className="field"><label htmlFor={`${fieldPrefix}-decision`}>Decision</label><select id={`${fieldPrefix}-decision`} name="decision" required defaultValue="RETAIN"><option value="RETAIN">Retain and review later</option>{held ? <option value="RELEASE_HOLD">Release legal/audit/safeguarding hold</option> : <option value="PLACE_HOLD">Place legal/audit/safeguarding hold</option>}<option value="DELETE">Permanently delete raw evidence</option></select></div>
            <div className="field"><label htmlFor={`${fieldPrefix}-reviewAfter`}>Review again after <span className="muted">optional</span></label><input id={`${fieldPrefix}-reviewAfter`} type="date" name="reviewAfter"/></div>
            <div className="field full"><label htmlFor={`${fieldPrefix}-deleteConfirmation`}>Permanent deletion confirmation <span className="muted">only when deleting</span></label><input id={`${fieldPrefix}-deleteConfirmation`} name="deleteConfirmation" autoComplete="off" placeholder="Type DELETE to confirm permanent deletion"/><small>For RETAIN or hold decisions, leave this blank. Permanent deletion fails closed unless the exact word DELETE is entered.</small></div>
            <div className="field full"><label htmlFor={`${fieldPrefix}-reason`}>Reason</label><textarea id={`${fieldPrefix}-reason`} name="reason" required maxLength={2000} placeholder="Why the file is still needed, why a hold applies, why a hold can be released, or why deletion is now appropriate."/></div>
            <div className="field full"><button className="button secondary" type="submit">Record retention decision</button><small>{terminal ? "Deletion is technically eligible if no hold applies, but the reviewer remains responsible for confirming audit/accounting/safeguarding needs first." : "Deletion is blocked while the case/linked appeal is still active; retain or place a hold instead."}</small></div>
          </form>}
        </article>;
      })}</div>}
      <nav className="filter-row" aria-label="Retention pagination">
        {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
        <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
        {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
      </nav>
    </section>
  </>;
}
