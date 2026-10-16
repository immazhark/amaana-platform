import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { DELIVERY_REPORT_LIMIT, DELIVERY_STATE_LABELS, canReportPrivateDelivery } from "@/lib/assistance-delivery";
import { OUTCOME_KIND_LABELS, OUTCOME_SUMMARY_LIMIT } from "@/lib/assistance-outcome";
import {
  assistanceCaseOutcomeSelect, hasAccessiblePrivateOutcomeEvidence,
} from "@/lib/assistance-case-outcome-view";
import { reportAssistanceOutcome } from "./outcome-actions";
import { OutcomeObservationRow } from "./outcome-observation-row";
import { reconcileAnonymousOutcomeDisclosures } from "./disclosure-actions";
import { linkAssistanceDeliveryEvidence, reportAssistanceDelivery, reviewAssistanceDelivery } from "./delivery-actions";
import { FOLLOW_UP_SUMMARY_LIMIT, MAX_OPEN_FOLLOW_UPS_PER_CASE, eligibleFollowUpStaffWhere, followUpDueLabel,
  indiaCalendarDay, shiftedCalendarDay, taskDay } from "@/lib/assistance-follow-up";
import { assignAssistanceFollowUp, createAssistanceFollowUp, resolveAssistanceFollowUp, rescheduleAssistanceFollowUp } from "./follow-up-actions";
import {
  PRIVATE_MILESTONE_ACTION, PRIVATE_MILESTONE_KINDS,
  PRIVATE_MILESTONE_REDACTED_ACTION, PRIVATE_MILESTONE_REDACTION_REASONS,
  PRIVATE_MILESTONE_SUMMARY_MAX, canAddPrivateMilestone,
  readPrivateMilestone, readPrivateMilestoneRedaction,
} from "@/lib/assistance-private-milestone";
import Link from "@/components/navigation-link";
import { AdminPrivateEvidenceUpload } from "@/components/admin-private-evidence-upload";
import { AdminPrivateDeliveryKindFields } from "@/components/admin-private-delivery-kind-fields";
import { FinancialCorroborationControls } from "./financial-corroboration-controls";
import { assistanceQueueAge, assistanceQueueVerificationLabel } from "@/lib/assistance-queue";
import {
  ASSISTANCE_CONFIDENTIALITY_LEVELS,
  ASSISTANCE_CONSENT_DECISIONS,
  ASSISTANCE_VERIFICATION_DECISIONS,
  ASSISTANCE_ZAKAT_STATUSES,
  MANUAL_ASSISTANCE_STATUSES,
  getPublicAppealVerificationIssues,
} from "@/lib/assistance";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignRequest, convertToAppeal, saveVerification, updateRequest } from "./actions";
import { addPrivateMilestone, redactPrivateMilestone } from "./milestone-actions";

type Props = { params: Promise<{ id: string }> };
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());

export default async function RequestDetailPage({ params }: Props) {
  const user = await requirePermission("assistance.view");
  const { id } = await params;
  const [request, staff, history, milestones, openTasks, resolvedTasks, taskStaff, deliveries, outcomes] = await Promise.all([
    prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        documents: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
        appeal: { select: { title: true, status: true } },
        verification: { include: { reviewedBy: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } } },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.auditEvent.findMany({ where: { entityType: "AssistanceRequest", entityId: id }, select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 }),
    prisma.auditEvent.findMany({
      where: { entityType: "AssistanceRequest", entityId: id,
        action: { in: [PRIVATE_MILESTONE_ACTION, PRIVATE_MILESTONE_REDACTED_ACTION] } },
      select: { id: true, action: true, metadata: true, createdAt: true,
        actor: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 60,
    }),
    prisma.assistanceFollowUp.findMany({
      where: { assistanceRequestId: id, state: "OPEN" },
      select: { id: true, summary: true, dueOn: true, state: true, assignedToId: true,
        assignedTo: { select: { name: true } },
        updatedAt: true, createdAt: true, createdBy: { select: { name: true } } },
      orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: MAX_OPEN_FOLLOW_UPS_PER_CASE,
    }),
    prisma.assistanceFollowUp.findMany({
      where: { assistanceRequestId: id, state: { in: ["COMPLETED", "CANCELLED"] } },
      select: { id: true, summary: true, dueOn: true, state: true, resolvedAt: true,
        resolvedBy: { select: { name: true } } },
      orderBy: [{ resolvedAt: "desc" }, { id: "desc" }],
      take: 10,
    }),
    prisma.user.findMany({
      where: eligibleFollowUpStaffWhere(),
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.assistanceDeliveryRecord.findMany({
      where: { assistanceRequestId: id },
      select: {
        id: true, kind: true, state: true, summary: true, occurredOn: true,
        amountInr: true, evidenceDocumentId: true, updatedAt: true,
        reportedById: true, reportedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }, reviewedAt: true,
        financialReconciliation: { select: {
          id: true, status: true, transactionReference: true, bankProofDocumentId: true,
          submittedById: true, reviewedBy: { select: { name: true } },
          reviewedAt: true, updatedAt: true,
        } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 30,
    }),
    prisma.assistanceOutcomeObservation.findMany({
      where: { assistanceRequestId: id },
      select: assistanceCaseOutcomeSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 30,
    }),
  ]);
  if (!request) notFound();
  // The displayed history is intentionally bounded, but duplicate-form
  // eligibility must consider every active observation on the 30 loaded
  // deliveries, not only the newest 30 historical rows.
  const activeSources = deliveries.length
    ? await prisma.assistanceOutcomeObservation.findMany({
      where: {
        deliveryRecordId: { in: deliveries.map(item => item.id) },
        state: { in: ["REPORTED", "REVIEWED"] },
      },
      select: { deliveryRecordId: true },
      take: deliveries.length,
    })
    : [];

  const converted = request.status === "CONVERTED_TO_APPEAL" || Boolean(request.appealId);
  const manualStatuses = [...MANUAL_ASSISTANCE_STATUSES];
  const visibleStatuses = converted
    ? ["CONVERTED_TO_APPEAL"]
    : hasPermission(user, "assistance.approve")
      ? manualStatuses
      : manualStatuses.filter(status => !["APPROVED", "REJECTED"].includes(status));
  const verification = request.verification;
  const publicAppealIssues = getPublicAppealVerificationIssues(verification);
  const publicAppealReady = publicAppealIssues.length === 0;
  const canCompleteVerification = hasPermission(user, "assistance.approve");
  const verificationLocked = converted;

  const operationalAge = assistanceQueueAge(request.createdAt, new Date());
  const canRecordMilestone = hasPermission(user, "assistance.update") &&
    canAddPrivateMilestone(request.status, request.appealId);
  const redactedMilestones = new Set(milestones.flatMap(event => {
    const target = event.action === PRIVATE_MILESTONE_REDACTED_ACTION
      ? readPrivateMilestoneRedaction(event.metadata) : null;
    return target ? [target] : [];
  }));
  const privateTimeline = milestones.flatMap(event => {
    if (event.action !== PRIVATE_MILESTONE_ACTION || redactedMilestones.has(event.id)) return [];
    const note = readPrivateMilestone(event.metadata);
    return note ? [{ ...note, id: event.id, actor: event.actor.name, createdAt: event.createdAt }] : [];
  }).slice(0, 20);
  const mayRedactMilestone = hasPermission(user, "assistance.approve");
  const canManageTasks = hasPermission(user, "assistance.update");
  const canCancelTasks = canManageTasks && hasPermission(user, "assistance.approve");
  const mayReassignTasks = hasPermission(user, "assistance.assign");
  const creatableTaskStaff = mayReassignTasks
    ? taskStaff : taskStaff.filter(member => member.id === user.id);
  const defaultTaskOwner = creatableTaskStaff.find(member => member.id === request.assignedToId)?.id ??
    creatableTaskStaff.find(member => member.id === user.id)?.id ?? creatableTaskStaff[0]?.id;
  const today = indiaCalendarDay(new Date());
  const currentDeliveryEligible = canReportPrivateDelivery(request.status, request.appealId, verification);
  const mayReportDelivery = hasPermission(user, "assistance.update") && currentDeliveryEligible;
  const mayReviewDelivery = hasPermission(user, "assistance.approve");
  const mayReviewFinancialEvidence = hasPermission(user, "donation.reconcile");
  const mayReportOutcome = hasPermission(user, "assistance.update");
  const mayReviewOutcome = hasPermission(user, "assistance.approve");
  const mayApproveAnonymousCopy = mayReviewOutcome && hasPermission(user, "content.approve");
  const activeOutcomeSources = new Set(activeSources.map(item => item.deliveryRecordId));
  const financeCorroborationCandidates = deliveries.filter(item =>
    mayReportDelivery && item.kind === "FINANCIAL" && item.state === "CONFIRMED" &&
    Boolean(item.amountInr) && Boolean(item.evidenceDocumentId) &&
    !item.financialReconciliation);
  const evidenceNames = new Map(request.documents.map(doc => [doc.id, doc.originalName]));
  const caseDocumentIds = new Set(evidenceNames.keys());
  const eligibleOutcomeCandidates = mayReportOutcome ? deliveries.filter(item =>
    !activeOutcomeSources.has(item.id) &&
    hasAccessiblePrivateOutcomeEvidence({
      ...item,
      assistanceRequest: {
        status: request.status, appealId: request.appealId, verification,
      },
    }, caseDocumentIds),
  ) : [];

  return <>
    <nav aria-label="Case navigation"><Link href="/admin">← Back to assistance queue</Link></nav>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">{request.referenceNumber}</p>
        <h1>{request.applicantName}</h1>
        <p className="muted">{request.category.replaceAll("_", " ")} · {request.city} · received {request.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        <p className="muted">Queue age: {operationalAge} · Verification: {assistanceQueueVerificationLabel(verification)}. Elapsed age is not an urgency assessment or deadline.</p>
      </div>
      <span className="status-badge">{request.status.replaceAll("_", " ")}</span>
    </div>

    <div className="admin-detail-grid">
      <div className="grid">
        <section className="card">
          <h2>Request details</h2>
          <dl className="details">
            <div><dt>Phone</dt><dd>{request.phone}</dd></div>
            <div><dt>Email</dt><dd>{request.email ?? "Not supplied"}</dd></div>
            <div className="full"><dt>Description</dt><dd>{request.description}</dd></div>
          </dl>
        </section>

        <section className="card">
          <h2>Private documents</h2>
          {request.documents.length ? <ul className="document-list">{request.documents.map(document => <li key={document.id}><a href={`/admin/documents/${document.id}`} target="_blank" rel="noreferrer">{document.originalName}</a><small>{document.mimeType} · {(document.sizeBytes / 1048576).toFixed(2)} MB</small></li>)}</ul> : <p className="muted">No documents were submitted.</p>}
        </section>

        <section className="card" aria-labelledby="private-delivery-heading">
          <h2 id="private-delivery-heading">Private support-delivery evidence</h2>
          <p className="muted">Approved request ≠ delivered support. Record only what was actually delivered;
            another authorized reviewer must confirm supporting evidence. This register
            does not post donations or publish impact and is never visible to applicants or donors.</p>
          {mayReportDelivery && deliveries.some(item => item.state === "REPORTED" &&
              item.reportedById === user.id && !item.evidenceDocumentId) &&
            request.documents.length < 30 && <AdminPrivateEvidenceUpload caseId={id}/>}
          {mayReportDelivery && deliveries.some(item => item.state === "REPORTED" &&
              item.reportedById === user.id && !item.evidenceDocumentId) &&
            request.documents.length >= 30 &&
            <p className="muted">This case has reached the private document limit.
              Ask an authorized reviewer to evaluate existing evidence.</p>}
          {financeCorroborationCandidates.length > 0 && request.documents.length < 30 &&
            <AdminPrivateEvidenceUpload caseId={id} purpose="financial"/>}
          {mayReportDelivery && <form action={reportAssistanceDelivery} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="submissionId" value={randomUUID()}/>
            <AdminPrivateDeliveryKindFields/>
            <label htmlFor="support-occurred">Actual delivery date (Hyderabad calendar)</label>
            <input id="support-occurred" name="occurredOn" type="date"
              defaultValue={today} max={today} min={shiftedCalendarDay(today, -1826)} required/>

            <label htmlFor="support-evidence">Existing private delivery-proof document</label>
            <select id="support-evidence" name="evidenceDocumentId" defaultValue="">
              <option value="">Not yet available — report cannot be confirmed</option>
              {request.documents.map(doc =>
                <option key={doc.id} value={doc.id}>{doc.originalName}</option>)}
            </select>
            <p className="muted">Select proof of actual delivery, not merely evidence of need.
              Documentation stays private; if proof is absent the report remains awaiting review.</p>
            <label htmlFor="support-summary">Internal delivery record (20–{DELIVERY_REPORT_LIMIT} characters)</label>
            <textarea id="support-summary" name="summary" minLength={20}
              maxLength={DELIVERY_REPORT_LIMIT} required
              placeholder="Briefly describe confirmed facts about the assistance reportedly delivered."/>
            <button type="submit" className="button secondary">Record delivered support for review</button>
          </form>}
          {deliveries.length ? <>
            <h3>Recorded deliveries</h3>
            <p className="muted">Latest {deliveries.length} records (maximum 30 shown).
              A confirmed review is an internal evidence check, not public-impact publication.</p>
            <ol className="history">{deliveries.map(item => <li key={item.id}>
              <strong>{item.kind === "FINANCIAL" ? "Financial support" : "Goods or services"}
                {" · "}{DELIVERY_STATE_LABELS[item.state]}</strong>
              <p>{item.summary}</p>
              <span>Reported delivery date: {item.occurredOn.toLocaleDateString("en-IN", { timeZone: "UTC" })}
                {item.amountInr ? ` · INR ${item.amountInr.toFixed(2)} (not a donor-ledger posting)` : ""}
                {" · "}Recorded by {item.reportedBy.name}</span>
              <p className="muted">Evidence: {item.evidenceDocumentId && evidenceNames.has(item.evidenceDocumentId)
                ? <a href={`/admin/documents/${item.evidenceDocumentId}`} target="_blank" rel="noreferrer">
                  {evidenceNames.get(item.evidenceDocumentId)}</a>
                : "No currently linked private document"}</p>
              {canManageTasks && item.state === "REPORTED" &&
                item.reportedById === user.id && !item.evidenceDocumentId &&
                request.documents.length > 0 &&
                <form className="field" action={linkAssistanceDeliveryEvidence}>
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="recordId" value={item.id}/>
                  <input type="hidden" name="expectedRecordUpdatedAt" value={item.updatedAt.toISOString()}/>
                  <label htmlFor={`delivery-proof-${item.id}`}>Attach subsequently received delivery proof</label>
                  <select id={`delivery-proof-${item.id}`} name="evidenceDocumentId" required defaultValue="">
                    <option value="" disabled>Choose an existing case document</option>
                    {request.documents.map(doc => <option key={doc.id} value={doc.id}>{doc.originalName}</option>)}
                  </select>
                  <button type="submit" className="button secondary">Attach private evidence for review</button>
                </form>}
              {item.state === "CONFIRMED" &&
                (!item.evidenceDocumentId || !evidenceNames.has(item.evidenceDocumentId)) &&
                <p role="alert" className="muted">Supporting proof is no longer available here.
                  This is a historical review record, not current evidence suitable for public reporting.</p>}
              {item.reviewedAt &&
                <small>Reviewed by {item.reviewedBy?.name ?? "authorized staff"} ·
                  {" "}{item.reviewedAt.toLocaleDateString("en-IN")}</small>}
              <FinancialCorroborationControls
                caseId={id} delivery={item} documents={request.documents}
                actorId={user.id} canPropose={mayReportDelivery}
                canReview={mayReviewFinancialEvidence}
              />
              {mayReviewDelivery && item.state !== "VOIDED" && <>
                {item.state === "REPORTED" && currentDeliveryEligible && item.evidenceDocumentId &&
                  evidenceNames.has(item.evidenceDocumentId) && item.reportedById !== user.id &&
                  <form className="field" action={reviewAssistanceDelivery}>
                    <input type="hidden" name="id" value={id}/>
                    <input type="hidden" name="recordId" value={item.id}/>
                    <input type="hidden" name="expectedRecordUpdatedAt" value={item.updatedAt.toISOString()}/>
                    <input type="hidden" name="state" value="CONFIRMED"/>
                    <label>
                      <input type="checkbox" name="evidenceAttested" value="yes" required/>
                      I personally reviewed the linked private evidence and am independent
                      of the reporting staff member.
                    </label>
                    <button className="button secondary" type="submit">Confirm reviewed delivery evidence</button>
                  </form>}
                <form className="field" action={reviewAssistanceDelivery}>
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="recordId" value={item.id}/>
                  <input type="hidden" name="expectedRecordUpdatedAt" value={item.updatedAt.toISOString()}/>
                  <input type="hidden" name="state" value="VOIDED"/>
                  <button className="button secondary" type="submit">Void erroneous delivery record</button>
                </form>
              </>}
            </li>)}</ol>
          </> : <p className="muted">No delivery has been reported or independently reviewed.</p>}
        </section>

        <section className="card" aria-labelledby="private-outcome-heading">
          <h2 id="private-outcome-heading">Private case-outcome observations</h2>
          {mayApproveAnonymousCopy &&
            outcomes.length > 0 &&
            <form action={reconcileAnonymousOutcomeDisclosures} className="field">
              <input type="hidden" name="id" value={id}/>
              <p className="muted">Recheck current case eligibility and all consent/evidence
                links. Invalid anonymous-copy proposals or publications will be
                withdrawn with an audit event. Valid approvals remain unchanged.</p>
              <button className="button secondary" type="submit">
                Reconcile and withdraw stale anonymous approvals
              </button>
            </form>}

          <p className="muted">Observations are about one specific delivery only.
            A completed support action does not mean medical recovery, full case resolution,
            financial settlement or publicly approved impact. Nothing here is published
            automatically. Independent review and an explicit separate publication process
            would be required for any future public communication.</p>
          {mayReportOutcome && <div className="field">
            <h3>Record a source-linked observation</h3>
            {eligibleOutcomeCandidates.map(item => (
              <details key={item.id}>
                <summary>Record outcome for {item.kind === "FINANCIAL" ? "financial" : "in-kind"} delivery
                  {" · "}{item.occurredOn.toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "medium" })}
                </summary>
                <form action={reportAssistanceOutcome} className="field">
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="deliveryRecordId" value={item.id}/>
                  <input type="hidden" name="expectedDeliveryUpdatedAt" value={item.updatedAt.toISOString()}/>
                  <input type="hidden" name="submissionId" value={randomUUID()}/>
                  <p className="muted">Linked delivery: {item.summary}</p>
                  <label htmlFor={`outcome-kind-${item.id}`}>Observed operational outcome</label>
                  <select id={`outcome-kind-${item.id}`} name="kind" required defaultValue="">
                    <option value="" disabled>Select only what evidence supports</option>
                    {Object.entries(OUTCOME_KIND_LABELS).map(([value, title]) =>
                      <option key={value} value={value}>{title}</option>)}
                  </select>
                  <label htmlFor={`outcome-summary-${item.id}`}>Specific internal observation</label>
                  <textarea id={`outcome-summary-${item.id}`} name="summary" minLength={20}
                    maxLength={OUTCOME_SUMMARY_LIMIT} required
                    placeholder="Record only evidence-supported operational facts, without private clinical speculation."/>
                  <label>
                    <input type="checkbox" name="limitedScopeAttested" value="yes" required/>
                    I confirm this describes only the linked support delivery, not case-wide
                    success, medical recovery, bank settlement or public impact.
                  </label>
                  <button className="button secondary" type="submit">
                    Submit private outcome for independent review
                  </button>
                </form>
              </details>
            ))}
            {eligibleOutcomeCandidates.length === 0 &&
              <p className="muted">No additional independently evidenced delivery
                is currently available for a new outcome observation.</p>}
          </div>}
          {mayReportOutcome && request.verification?.confidentialityLevel === "STANDARD" &&
            request.documents.length < 30 &&
            outcomes.some(item => item.state === "REVIEWED" && !item.disclosure &&
              hasAccessiblePrivateOutcomeEvidence({
                ...item.deliveryRecord,
                assistanceRequest: {
                  status: request.status, appealId: request.appealId, verification,
                },
              }, caseDocumentIds)) &&
            <AdminPrivateEvidenceUpload caseId={id} purpose="consent"/>}
          {outcomes.length > 0 && <p className="muted">Latest {outcomes.length}
            private observations shown (maximum 30). Review state is not public-impact approval.</p>}
          {outcomes.length ? <ol className="history">
            {outcomes.map(item => (
              <OutcomeObservationRow
                key={item.id} caseId={id} outcome={item}
                caseStatus={request.status} appealId={request.appealId}
                verification={verification}
                standardConfidentiality={verification?.confidentialityLevel === "STANDARD"}
                documentIds={caseDocumentIds} documents={request.documents}
                actorId={user.id}
                mayReport={mayReportOutcome} mayReview={mayReviewOutcome}
                mayApproveCopy={mayApproveAnonymousCopy}
              />
            ))}
          </ol> : <p className="muted">No private outcome observations have been recorded.</p>}
        </section>

        <section className="card" aria-labelledby="private-follow-up-heading">
          <h2 id="private-follow-up-heading">Next private follow-up actions</h2>
          <p className="muted">Staff-set dates, not urgency classifications or SLA deadlines.
            Tasks are internal only and never appear as public appeal milestones.
            Open tasks remain on the case until a reviewer completes or cancels them.</p>
          {canManageTasks && defaultTaskOwner && canAddPrivateMilestone(request.status, request.appealId) &&
            openTasks.length < MAX_OPEN_FOLLOW_UPS_PER_CASE ? (
            <form action={createAssistanceFollowUp} className="field">
              <input type="hidden" name="id" value={id}/>
              <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
              <input type="hidden" name="submissionId" value={randomUUID()}/>
              <label htmlFor="newTaskOwner">Responsible staff member</label>
              <select id="newTaskOwner" name="assignedToId" defaultValue={defaultTaskOwner} required>
                {creatableTaskStaff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
              <label htmlFor="taskDueOn">Next action date (Hyderabad calendar)</label>
              <input id="taskDueOn" type="date" name="dueOn" defaultValue={today}
                min={today} max={shiftedCalendarDay(today, 365)} required/>
              <label htmlFor="taskSummary">Private action to complete</label>
              <textarea id="taskSummary" name="summary" minLength={12}
                maxLength={FOLLOW_UP_SUMMARY_LIMIT} required
                placeholder="Describe the next operational action without repeating private documents."/>
              <button className="button secondary" type="submit">Schedule private follow-up</button>
            </form>
          ) : <p className="muted">
            {openTasks.length >= MAX_OPEN_FOLLOW_UPS_PER_CASE
              ? "This case has 20 open tasks. Resolve an existing task before adding another."
              : "Scheduling is restricted to authorized staff working on open cases."}
          </p>}
          {openTasks.length ? <>
            <h3>Open tasks ({openTasks.length})</h3>
            <ol className="history">{openTasks.map(task => <li key={task.id}>
              <strong>{task.summary}</strong>
              <span>Selected date: {task.dueOn.toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "medium" })}
                {" · "}{followUpDueLabel(task.state, task.dueOn, today)}
                {" · "}Responsible: {task.assignedTo.name}
                {" · "}Recorded by {task.createdBy.name}</span>
              {mayReassignTasks && canAddPrivateMilestone(request.status, request.appealId) &&
                <form action={assignAssistanceFollowUp} className="field">
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="taskId" value={task.id}/>
                  <input type="hidden" name="expectedTaskUpdatedAt" value={task.updatedAt.toISOString()}/>
                  <label htmlFor={`task-owner-${task.id}`}>Transfer responsibility</label>
                  <select id={`task-owner-${task.id}`} name="assignedToId"
                    defaultValue={task.assignedToId} required>
                    {!taskStaff.some(member => member.id === task.assignedToId) &&
                      <option value={task.assignedToId} disabled>{task.assignedTo.name} (not eligible)</option>}
                    {taskStaff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                  <button type="submit" className="button secondary">Assign to staff</button>
                </form>}
              {canManageTasks && (task.assignedToId === user.id || mayReassignTasks) &&
                canAddPrivateMilestone(request.status, request.appealId) &&
                <form action={rescheduleAssistanceFollowUp} className="field">
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="taskId" value={task.id}/>
                  <input type="hidden" name="expectedTaskUpdatedAt" value={task.updatedAt.toISOString()}/>
                  <label htmlFor={`task-due-${task.id}`}>Change this action date</label>
                  <input id={`task-due-${task.id}`} name="dueOn" type="date"
                    defaultValue={taskDay(task.dueOn)} min={today}
                    max={shiftedCalendarDay(today, 365)} required/>
                  <button type="submit" className="button secondary">Save new date</button>
                </form>}
              {canManageTasks && (task.assignedToId === user.id || mayReassignTasks) &&
                <form action={resolveAssistanceFollowUp} className="field">
                <input type="hidden" name="id" value={id}/>
                <input type="hidden" name="taskId" value={task.id}/>
                <input type="hidden" name="state" value="COMPLETED"/>
                <input type="hidden" name="expectedTaskUpdatedAt" value={task.updatedAt.toISOString()}/>
                <button type="submit" className="button secondary">Mark action completed</button>
              </form>}
              {canCancelTasks && (task.assignedToId === user.id || mayReassignTasks) &&
                <form action={resolveAssistanceFollowUp} className="field">
                <input type="hidden" name="id" value={id}/>
                <input type="hidden" name="taskId" value={task.id}/>
                <input type="hidden" name="state" value="CANCELLED"/>
                <input type="hidden" name="expectedTaskUpdatedAt" value={task.updatedAt.toISOString()}/>
                <button type="submit" className="button secondary">Cancel this action</button>
              </form>}
            </li>)}</ol>
          </> : <p className="muted">No open follow-up tasks for this case.</p>}
          {resolvedTasks.length > 0 && <>
            <h3>Recently resolved tasks</h3>
            <ol className="history">{resolvedTasks.map(task => <li key={task.id}>
              <strong>{task.summary}</strong>
              <span>{followUpDueLabel(task.state, task.dueOn, today)}
                {" · "}{task.resolvedAt?.toLocaleString("en-IN") ?? "Resolution date unavailable"}
                {" · "}{task.resolvedBy?.name ?? "Authorized staff"}
              </span>
            </li>)}</ol>
          </>}
        </section>

        <section className="card" aria-labelledby="private-case-timeline">
          <h2 id="private-case-timeline">Private case follow-ups</h2>
          <p className="muted">Internal operational milestones only. These entries are append-only,
            not applicant notifications, public appeal updates, approval decisions or evidence of case impact.
            Record only the minimum details needed by the case team.</p>
          {canRecordMilestone ? <form action={addPrivateMilestone} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="submissionId" value={randomUUID()}/>
            <label htmlFor="privateMilestoneKind">Follow-up type</label>
            <select id="privateMilestoneKind" name="kind" required>
              {Object.entries(PRIVATE_MILESTONE_KINDS).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>)}
            </select>
            <label htmlFor="privateMilestoneSummary">Internal follow-up summary</label>
            <textarea id="privateMilestoneSummary" name="summary" minLength={12}
              maxLength={PRIVATE_MILESTONE_SUMMARY_MAX} required
              placeholder="What was followed up, by whom, and what remains to be checked?"/>
            <small className="muted">12–{PRIVATE_MILESTONE_SUMMARY_MAX} characters.
              Do not duplicate identity documents, account details or clinical reports.</small>
            <button className="button secondary" type="submit">Record private follow-up</button>
          </form> : <p className="muted">New follow-ups are available only to authorized staff while the case is open and not converted to an appeal.</p>}
          {privateTimeline.length ? <>
            <h3>Recent operational history</h3>
            <p className="muted">Up to 20 of the latest non-redacted private entries are shown.
              Redacted entries remain in the restricted audit record but are not displayed here.</p>
            <ol className="history">
              {privateTimeline.map(item => <li key={item.id}>
                <strong>{PRIVATE_MILESTONE_KINDS[item.kind]}</strong>
                <p>{item.summary}</p>
                <span>{item.actor} · {item.createdAt.toLocaleString("en-IN")}</span>
                {mayRedactMilestone && <form action={redactPrivateMilestone} className="field">
                  <input type="hidden" name="id" value={id}/>
                  <input type="hidden" name="targetId" value={item.id}/>
                  <label htmlFor={`milestone-redaction-${item.id}`}>Reason to remove from case view</label>
                  <select id={`milestone-redaction-${item.id}`} name="reason" required>
                    {Object.entries(PRIVATE_MILESTONE_REDACTION_REASONS).map(([reason, label]) =>
                      <option key={reason} value={reason}>{label}</option>)}
                  </select>
                  <button type="submit" className="button secondary">
                    Redact this private follow-up
                  </button>
                </form>}
              </li>)}
            </ol>
          </> : <p className="muted">No private follow-ups have been recorded.</p>}
        </section>

        <section className="card">
          <h2>Private verification & publication gate</h2>
          <p className="muted">Record verification, funding checks, disclosure permissions and Zakat review here. This information is internal and is not copied automatically into public appeal text.</p>
          <form action={saveVerification} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedRequestUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="expectedVerificationUpdatedAt" value={verification?.updatedAt.toISOString() ?? ""}/>

            <label htmlFor="confidentialityLevel">Confidentiality level</label>
            <select id="confidentialityLevel" name="confidentialityLevel" defaultValue={verification?.confidentialityLevel ?? "CONFIDENTIAL"} disabled={verificationLocked}>
              {ASSISTANCE_CONFIDENTIALITY_LEVELS.map(value => <option key={value} value={value}>{label(value)}</option>)}
            </select>

            <label className="checkbox"><input type="checkbox" name="needConfirmed" defaultChecked={verification?.needConfirmed ?? false} disabled={verificationLocked}/><span><strong>Need confirmed</strong><small>The underlying charitable need has been verified.</small></span></label>
            <label className="checkbox"><input type="checkbox" name="evidenceReviewed" defaultChecked={verification?.evidenceReviewed ?? false} disabled={verificationLocked}/><span><strong>Supporting evidence reviewed</strong><small>Relevant private proof has been reviewed; do not publish the raw documents.</small></span></label>
            <label className="checkbox"><input type="checkbox" name="otherFundingChecked" defaultChecked={verification?.otherFundingChecked ?? false} disabled={verificationLocked}/><span><strong>Other funding checked</strong><small>Duplicate fundraising, concessions, insurance, government help or other major support has been considered.</small></span></label>

            <label htmlFor="verifiedNeedAmount">Verified need amount (₹)</label>
            <input id="verifiedNeedAmount" name="verifiedNeedAmount" type="text" inputMode="decimal" pattern="(?:0\.(?:0[1-9]|[1-9][0-9]?)|[1-9][0-9]*(?:\.[0-9]{1,2})?)" maxLength={16} defaultValue={verification?.verifiedNeedAmount?.toString() ?? ""} disabled={verificationLocked}/>

            <label htmlFor="approvedPublicTarget">Approved public fundraising target (₹)</label>
            <input id="approvedPublicTarget" name="approvedPublicTarget" type="text" inputMode="decimal" pattern="(?:0\.(?:0[1-9]|[1-9][0-9]?)|[1-9][0-9]*(?:\.[0-9]{1,2})?)" maxLength={16} defaultValue={verification?.approvedPublicTarget?.toString() ?? ""} disabled={verificationLocked}/>
            <small className="muted">Positive rupees only; up to two decimal places. Use only when the decision is Approved Public. It cannot exceed the verified need.</small>

            <label htmlFor="paymentDestination">Payment destination</label>
            <input id="paymentDestination" name="paymentDestination" maxLength={500} defaultValue={verification?.paymentDestination ?? ""} placeholder="Hospital, vendor, beneficiary transfer, asset purchase, verified settlement…" disabled={verificationLocked}/>

            <label htmlFor="otherFundingNotes">Other funding / duplication notes</label>
            <textarea id="otherFundingNotes" name="otherFundingNotes" maxLength={2000} defaultValue={verification?.otherFundingNotes ?? ""} disabled={verificationLocked}/>

            <label htmlFor="verificationSummary">Verification summary</label>
            <textarea id="verificationSummary" name="verificationSummary" maxLength={5000} defaultValue={verification?.verificationSummary ?? ""} placeholder="Internal factual summary of what was checked and what is approved." disabled={verificationLocked}/>

            <label htmlFor="decision">Verification decision</label>
            <select id="decision" name="decision" defaultValue={verification?.decision ?? "PENDING"} disabled={verificationLocked}>
              {ASSISTANCE_VERIFICATION_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}
            </select>

            <label htmlFor="publicNameConsent">Public name permission</label>
            <select id="publicNameConsent" name="publicNameConsent" defaultValue={verification?.publicNameConsent ?? "UNCONFIRMED"} disabled={verificationLocked}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>

            <label htmlFor="photoConsent">Photo/media permission</label>
            <select id="photoConsent" name="photoConsent" defaultValue={verification?.photoConsent ?? "UNCONFIRMED"} disabled={verificationLocked}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>

            <label htmlFor="medicalDetailsConsent">Medical-detail disclosure permission</label>
            <select id="medicalDetailsConsent" name="medicalDetailsConsent" defaultValue={verification?.medicalDetailsConsent ?? "UNCONFIRMED"} disabled={verificationLocked}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>

            <label htmlFor="institutionNameConsent">Hospital / institution naming permission</label>
            <select id="institutionNameConsent" name="institutionNameConsent" defaultValue={verification?.institutionNameConsent ?? "UNCONFIRMED"} disabled={verificationLocked}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>

            <label htmlFor="archiveConsent">Public archive permission after closure</label>
            <select id="archiveConsent" name="archiveConsent" defaultValue={verification?.archiveConsent ?? "UNCONFIRMED"} disabled={verificationLocked}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>

            <label htmlFor="zakatStatus">Zakat review</label>
            <select id="zakatStatus" name="zakatStatus" defaultValue={verification?.zakatStatus ?? "UNREVIEWED"} disabled={verificationLocked}>{ASSISTANCE_ZAKAT_STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
            <small className="muted">Never infer Zakat eligibility. Choose Not applicable when the case is not being assessed for Zakat.</small>

            <label className="checkbox"><input type="checkbox" name="markComplete" defaultChecked={Boolean(verification?.completedAt)} disabled={verificationLocked || !canCompleteVerification}/><span><strong>Verification complete</strong><small>Completing verification records the approving reviewer and enables approved workflow transitions. Approval permission is required.</small></span></label>
            {!canCompleteVerification && !verificationLocked && <small className="muted">You may save verification work, but only an authorised approver can mark it complete.</small>}
            {verification?.completedAt && <small className="muted">Completed {verification.completedAt.toLocaleString("en-IN")} by {verification.reviewedBy?.name ?? "authorised reviewer"}.</small>}
            {verificationLocked && <small className="muted">Verification is locked because this request has already been converted into a linked appeal.</small>}
            <button className="button" disabled={!hasPermission(user, "assistance.update") || verificationLocked}>Save verification</button>
          </form>

          {verification?.decision === "APPROVED_PUBLIC" && <div>
            <h3>Public appeal readiness</h3>
            {publicAppealReady ? <p className="muted">Verification and disclosure controls are complete for draft-appeal conversion. Public copy and media still require the normal appeal review before publication.</p> : <ul>{publicAppealIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
          </div>}
        </section>

        <section className="card">
          <h2>Audit history</h2>
          {history.length ? <>
            <p className="muted">Latest {history.length} recorded events (maximum 50 shown). Older events remain in the restricted audit history.</p>
            <ol className="history">{history.map(event => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.actor.name} · {event.createdAt.toLocaleString("en-IN")}</span></li>)}</ol>
          </> : <p className="muted">No changes recorded yet.</p>}
        </section>
      </div>

      <aside className="grid">
        <section className="card">
          <h2>Assignment</h2>
          <p className="muted">Case ownership and scheduled task responsibility are separate.
            Changing the case assignee does not silently transfer open tasks;
            use each task's Transfer responsibility control for an audited handoff.</p>
          <form action={assignRequest} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="assignedToId">Assigned staff member</label>
            <select id="assignedToId" name="assignedToId" defaultValue={request.assignedToId ?? ""}><option value="">Unassigned</option>{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            <button className="button secondary" disabled={!hasPermission(user, "assistance.assign")}>Save assignment</button>
          </form>
        </section>

        <section className="card">
          <h2>Review</h2>
          <form action={updateRequest} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={request.status} disabled={converted}>{visibleStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
            {converted && <input type="hidden" name="status" value="CONVERTED_TO_APPEAL"/>}
            <label htmlFor="internalNotes">Internal notes</label>
            <textarea id="internalNotes" name="internalNotes" defaultValue={request.internalNotes ?? ""} maxLength={10000}/>
            {converted && <small className="muted">The converted status is managed by the linked appeal workflow; internal notes can still be updated here.</small>}
            <button className="button" disabled={!hasPermission(user, "assistance.update")}>Save review</button>
          </form>
        </section>

        {request.status === "APPROVED" && !request.appeal && verification?.decision === "APPROVED_PUBLIC" && publicAppealReady && hasPermission(user, "appeal.create") && hasPermission(user, "assistance.update") && <section className="card">
          <h2>Create draft appeal</h2>
          <p className="muted">The target is locked to the approved verification record. Write new privacy-safe public copy; raw intake text is never copied automatically.</p>
          <dl className="details"><div><dt>Approved target</dt><dd>₹{verification.approvedPublicTarget!.toNumber().toLocaleString("en-IN")}</dd></div></dl>
          <form action={convertToAppeal} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="expectedVerificationUpdatedAt" value={verification.updatedAt.toISOString()}/>
            <label htmlFor="title">Public title</label>
            <input id="title" name="title" minLength={8} required/>
            <label htmlFor="publicSummary">Public summary</label>
            <textarea id="publicSummary" name="publicSummary" minLength={20} maxLength={500} required placeholder="Concise verified need without unnecessary private detail."/>
            <label htmlFor="publicStory">Public story</label>
            <textarea id="publicStory" name="publicStory" minLength={40} maxLength={5000} required placeholder="Privacy-safe public narrative based only on approved facts and disclosure permissions."/>
            <button className="button">Create draft appeal</button>
          </form>
        </section>}

        {request.status === "APPROVED" && !request.appeal && verification?.decision && verification.decision !== "APPROVED_PUBLIC" && <section className="card">
          <h2>Approved support route</h2>
          <p className="muted">This verification decision is {label(verification.decision)}. No public appeal conversion is offered unless the case has been specifically approved for public fundraising.</p>
        </section>}

        {request.appeal && <section className="card"><h2>Linked appeal</h2><p>{request.appeal.title}</p><span className="status-badge">{request.appeal.status}</span></section>}
      </aside>
    </div>
  </>;
}
