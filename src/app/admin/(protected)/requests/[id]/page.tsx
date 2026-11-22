import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ASSISTANCE_CONFIDENTIALITY_LEVELS,
  ASSISTANCE_CONSENT_DECISIONS,
  ASSISTANCE_VERIFICATION_DECISIONS,
  ASSISTANCE_ZAKAT_STATUSES,
  MANUAL_ASSISTANCE_STATUSES,
  getPublicAppealVerificationIssues,
} from "@/lib/assistance";
import { cookies } from "next/headers";
import { parseRejectionNotice, rejectionDraftCookieName, rejectionDraftFromCookie, rejectionEligibility } from "@/lib/assistance-rejection";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignRequest, convertToAppeal, saveVerificationWithFeedback, updateRequestWithFeedback } from "./actions";
import { rejectRequestAction } from "./rejection-actions";
import { AdminActionFeedbackForm } from "@/components/admin-action-feedback-form";
import { RejectRequestForm } from "@/components/reject-request-form";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());

export default async function RequestDetailPage({ params, searchParams }: Props) {
  const user = await requirePermission("assistance.view");
  const { id } = await params;
  const notice = parseRejectionNotice(await (searchParams ?? Promise.resolve({})));
  // What the reviewer typed before an error, held privately in a short-lived cookie (never in the address), read only then.
  const draftName = notice?.kind === "error" ? rejectionDraftCookieName(id) : null;
  const draftReason = draftName ? rejectionDraftFromCookie((await cookies()).get(draftName)?.value) : "";
  const [request, staff, history] = await Promise.all([
    prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { name: true } },
        documents: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        appeal: { select: { id: true, title: true, status: true } },
        verification: { include: { reviewedBy: { select: { name: true } } } },
        // Only the latest decision, and only its private reason, who made it and when: a bounded read.
        rejections: { orderBy: [{ rejectedAt: "desc" }, { id: "desc" }], take: 1, select: { reason: true, rejectedAt: true, rejectedBy: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.auditEvent.findMany({ where: { entityType: "AssistanceRequest", entityId: id }, select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
  ]);
  if (!request) notFound();

  const currentAssigneeUnavailable = Boolean(request.assignedToId && !staff.some(member => member.id === request.assignedToId));
  const converted = request.status === "CONVERTED_TO_APPEAL" || Boolean(request.appealId);
  // Rejecting is its own form below, so REJECTED is offered here only to show the state a request is already in.
  const manualStatuses = MANUAL_ASSISTANCE_STATUSES.filter(status => status !== "REJECTED" || request.status === "REJECTED");
  const visibleStatuses = converted
    ? ["CONVERTED_TO_APPEAL"]
    : hasPermission(user, "assistance.approve")
      ? manualStatuses
      : manualStatuses.filter(status => status === request.status || status !== "APPROVED");
  const rejection = rejectionEligibility(request.status, converted);
  const latestRejection = request.rejections?.[0] ?? null;
  const canReject = hasPermission(user, "assistance.update") && hasPermission(user, "assistance.approve");
  const verification = request.verification;
  const publicAppealIssues = getPublicAppealVerificationIssues(verification);
  const publicAppealReady = publicAppealIssues.length === 0;
  const canCompleteVerification = hasPermission(user, "assistance.approve");
  const verificationLocked = converted;

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">{request.referenceNumber}</p>
        <h1>{request.applicantName}</h1>
        <p className="muted">{request.category.replaceAll("_", " ")} · {request.city} · received {request.createdAt.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })}</p>
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
          {request.documents.length ? <ul className="document-list">{request.documents.map(document => <li key={document.id}><a href={`/admin/documents/${document.id}`} target="_blank" rel="noreferrer">{document.originalName}<span className="sr-only"> (opens in a new tab)</span></a><small>{document.mimeType} · {(document.sizeBytes / 1048576).toFixed(2)} MB</small></li>)}</ul> : <p className="muted">No documents were submitted.</p>}
        </section>

        {rejection !== "unknown" && <section className="card" aria-labelledby="reject-heading">
          <h2 id="reject-heading">{rejection === "already_rejected" ? "Request rejected" : "Reject request"}</h2>
          {rejection === "linked_appeal" && <>
            <p>This request has a linked appeal. Open the appeal to manage its status.</p>
            <p className="muted">A request with a linked appeal is not rejected here: pausing or closing a published appeal follows the appeal&apos;s own rules and does not change donations or financial records by itself.</p>
            {request.appeal && hasPermission(user, "appeal.view") && <Link className="button secondary" href={`/admin/appeals/${request.appeal.id}`}>Open the linked appeal</Link>}
          </>}
          {rejection === "closed" && <p>This request is closed. Reopen the review under Review first if it needs to be rejected.</p>}
          {rejection === "already_rejected" && <>
            {notice?.kind === "done" && <div role="status">
              <p><strong>{notice.outcome === "rejected" ? "The request has been rejected." : "This request was already rejected."}</strong> {request.referenceNumber} is now Rejected. Your reason is kept privately with the request and is not sent to the applicant.</p>
              <Link className="button secondary" href="/admin">Back to the queue</Link>
            </div>}
            {latestRejection
              ? <dl className="details">
                <div><dt>Recorded by</dt><dd>{latestRejection.rejectedBy.name}</dd></div>
                <div><dt>Recorded</dt><dd>{latestRejection.rejectedAt.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" })}</dd></div>
                <div className="full"><dt>Reason (private)</dt><dd>{latestRejection.reason}</dd></div>
              </dl>
              : <p>This request was rejected before reasons were recorded. No historical reason, reviewer or time is on file, and none has been invented.</p>}
            <p className="muted">To review it again, change its status under Review. Nothing is deleted, and an earlier decision stays on record.</p>
          </>}
          {rejection === "eligible" && (canReject ? <>
            <p className="muted">Enter the reason and confirm. You do not need to complete any approval check to reject a request, and nothing you have entered in the verification form is used or required.</p>
            <RejectRequestForm action={rejectRequestAction} requestId={id} referenceNumber={request.referenceNumber} requestVersion={request.updatedAt.toISOString()} verificationVersion={verification?.updatedAt.toISOString() ?? ""} notice={notice?.kind === "error" ? notice : null} draftReason={draftReason} />
          </> : <p className="muted">Only an authorised approver can reject a request. You can still save review notes; ask an approver to decide this case.</p>)}
        </section>}

        <section className="card">
          <h2>Private verification & publication gate</h2>
          <p className="muted">Record verification, funding checks, disclosure permissions and Zakat review here. This information is internal and is not copied automatically into public appeal text.</p>
          <AdminActionFeedbackForm action={saveVerificationWithFeedback}>
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
            {verification?.completedAt && <small className="muted">Completed {verification.completedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} by {verification.reviewedBy?.name ?? "authorised reviewer"}.</small>}
            {verificationLocked && <small className="muted">Verification is locked because this request has already been converted into a linked appeal.</small>}
            <button className="button" disabled={!hasPermission(user, "assistance.update") || verificationLocked}>Save verification</button>
          </AdminActionFeedbackForm>

          {verification?.decision === "APPROVED_PUBLIC" && <div>
            <h3>Public appeal readiness</h3>
            {publicAppealReady ? <p className="muted">Verification and disclosure controls are complete for draft-appeal conversion. Public copy and media still require the normal appeal review before publication.</p> : <ul>{publicAppealIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
          </div>}
        </section>

        <section className="card">
          <h2>Audit history</h2>
          {history.length ? <ol className="history">{history.map(event => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.actor.name} · {event.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></li>)}</ol> : <p className="muted">No changes recorded yet.</p>}
        </section>
      </div>

      <aside className="grid">
        <section className="card">
          <h2>Assignment</h2>
          <form action={assignRequest} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="assignedToId">Assigned staff member</label>
            <select id="assignedToId" name="assignedToId" defaultValue={request.assignedToId ?? ""} aria-describedby={currentAssigneeUnavailable ? "assignment-availability" : undefined}><option value="">Unassigned</option>{currentAssigneeUnavailable && <option value={request.assignedToId!}>{`${request.assignedTo?.name ?? "Current staff member"} (currently unavailable)`}</option>}{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            {currentAssigneeUnavailable && <small id="assignment-availability" className="muted">The current assignee is unavailable for assignment. Choose an available staff member or Unassigned before saving a change.</small>}
            <button className="button secondary" disabled={!hasPermission(user, "assistance.assign")}>Save assignment</button>
          </form>
        </section>

        <section className="card">
          <h2>Review</h2>
          <AdminActionFeedbackForm action={updateRequestWithFeedback}>
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={request.status} disabled={converted}>{visibleStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
            {converted && <input type="hidden" name="status" value="CONVERTED_TO_APPEAL"/>}
            <label htmlFor="internalNotes">Internal notes</label>
            <textarea id="internalNotes" name="internalNotes" defaultValue={request.internalNotes ?? ""} maxLength={10000}/>
            {converted && <small className="muted">The converted status is managed by the linked appeal workflow; internal notes can still be updated here.</small>}
            <button className="button" disabled={!hasPermission(user, "assistance.update")}>Save review</button>
          </AdminActionFeedbackForm>
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

        {request.appeal && <section className="card"><h2>Linked appeal</h2><p>{request.appeal.title}</p><span className="status-badge">{request.appeal.status}</span>{hasPermission(user, "appeal.view") && <Link className="button secondary" href={`/admin/appeals/${request.appeal.id}`}>Open appeal editor</Link>}</section>}
      </aside>
    </div>
  </>;
}
