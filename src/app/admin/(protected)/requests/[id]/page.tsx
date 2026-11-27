import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ASSISTANCE_CONFIDENTIALITY_LEVELS,
  ASSISTANCE_CONSENT_DECISIONS,
  ASSISTANCE_ZAKAT_STATUSES,
  MANUAL_ASSISTANCE_STATUSES,
  getPublicAppealVerificationIssues,
} from "@/lib/assistance";
import { cookies } from "next/headers";
import {
  APPROVAL_ERROR_MESSAGES, APPROVAL_ROUTES, approvalAmountDraftFromCookie, approvalDraftCookieName, approvalProblemField, approvalProblemMessage, parseApprovalNotice, type ApprovalProblem,
} from "@/lib/assistance-approval";
import { parseRejectionNotice, rejectionDraftCookieName, rejectionDraftFromCookie, rejectionEligibility } from "@/lib/assistance-rejection";
import { hasPermission, requirePermission } from "@/lib/auth";
import { assistanceCaseHref, assistanceQueueContext, assistanceQueueHref, assistanceReturnFilters } from "@/lib/assistance-queue-navigation";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { caseHistoryHref, caseHistoryPage, caseHistoryQuery, parseCaseHistoryBoundary } from "@/lib/assistance-case-history";
import { closureTransitionQuery, lifecycleEvidence } from "@/lib/assistance-lifecycle-evidence";
import { assignRequest, convertToAppeal, updateRequestWithFeedback } from "./actions";
import { approveRequestAction, approveRequestWithFeedback, saveReviewProgressWithFeedback } from "./approval-actions";
import { rejectRequestAction } from "./rejection-actions";
import { AdminActionFeedbackForm } from "@/components/admin-action-feedback-form";
import { ApprovalSummary } from "./approval-summary";
import { ApprovalCheckAnswers } from "@/components/approval-check-answers";
import { RejectRequestForm } from "@/components/reject-request-form";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };
const REQUIRED_TO_APPROVE = "Required to approve";
const REQUIRED_FOR_PUBLIC = "Required for public fundraising only; not needed for private or partial support";
const CONSENT_LABEL: Record<string, string> = { UNCONFIRMED: "Unconfirmed (not decided yet)", ALLOWED: "Allowed", NOT_ALLOWED: "Not allowed (a restriction)", NOT_APPLICABLE: "Not applicable (genuinely irrelevant)" };
const ROUTE_CHOICE_LABEL: Record<string, string> = {
  PENDING: "Not decided yet", REFERRED: "Referred elsewhere (saves progress only)", APPROVED_PRIVATE: "Private assistance", APPROVED_PARTIAL: "Partial support",
  APPROVED_PUBLIC: "Public fundraising", DECLINED: "Declined (set by Reject request)",
};
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());

const residenceLabel = (value: string | null | undefined): string => {
  switch (value) {
    case "HYDERABAD_SERVICE_AREA": return "In the Hyderabad service area";
    case "OUTSIDE_SERVICE_AREA": return "Outside the service area";
    case null:
    case undefined: return "Not recorded — confirm beneficiary residence";
    default: return "Unrecognized answer — confirm beneficiary residence";
  }
};

export default async function RequestDetailPage({ params, searchParams }: Props) {
  const user = await requirePermission("assistance.view");
  const { id } = await params;
  const search: Record<string, string | string[] | undefined> = await (searchParams ?? Promise.resolve({}));
  const returnFilters = assistanceReturnFilters(search);
  const queueHref = assistanceQueueHref(returnFilters);
  const queueContext = assistanceQueueContext(returnFilters);
  const queueFields = Object.entries(queueContext).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>);
  const notice = parseRejectionNotice(search);
  // What the reviewer typed before an error, held privately in a short-lived cookie (never in the address), read only then.
  const draftName = notice?.kind === "error" ? rejectionDraftCookieName(id) : null;
  const approvalNotice = parseApprovalNotice(search);
  const approvalProblems: ApprovalProblem[] = approvalNotice?.kind === "error" ? approvalNotice.problems : [];
  // The text of an amount that was not a valid amount cannot be saved, so it is held briefly in a private cookie, read only then.
  const approvalDraftName = approvalProblems.some(problem => problem.endsWith("_format")) ? approvalDraftCookieName(id) : null;
  const amountDraft = approvalDraftName ? approvalAmountDraftFromCookie((await cookies()).get(approvalDraftName)?.value) : { verifiedNeedAmount: "", approvedPublicTarget: "" };
  const draftReason = draftName ? rejectionDraftFromCookie((await cookies()).get(draftName)?.value) : "";
  const historyBoundary = parseCaseHistoryBoundary(search.historyBefore);
  const [request, staff, historyRows] = await Promise.all([
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
    prisma.auditEvent.findMany(caseHistoryQuery(id, historyBoundary)).catch(() => {
      logServerError("assistance.case_history_unavailable");
      return null;
    }),
  ]);
  if (!request) notFound();
  const history = historyRows === null ? null : caseHistoryPage(historyRows);
  // A shared phone number or email is a prompt for human judgement, never proof of a duplicate or of anything else.
  const possibleDuplicates = await prisma.assistanceRequest.findMany({
    where: { id: { not: id }, OR: [{ phone: request.phone }, ...(request.email ? [{ email: request.email }] : [])] },
    select: { id: true, referenceNumber: true, status: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5,
  });

  const closureTransition = request.status === "CLOSED" ? await prisma.auditEvent.findMany(closureTransitionQuery(id)).then(rows => rows[0] ?? null).catch(() => {
    logServerError("assistance.closure_evidence_unavailable");
    return undefined;
  }) : null;
  const lifecycle = lifecycleEvidence(request, closureTransition);
  const evidenceDate = (date: Date | null) => date ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not recorded or inconsistent";
  const lifecycleGapLabels = { acceptance: "Formal acceptance date needs review.", verification: "Completed approval verification needs review.", appeal_link: "Linked appeal record needs review." } as const;
  const currentAssigneeUnavailable = Boolean(request.assignedToId && !staff.some(member => member.id === request.assignedToId));
  const converted = request.status === "CONVERTED_TO_APPEAL" || Boolean(request.appealId);
  // Approving and rejecting are their own actions, so APPROVED and REJECTED are offered here only to show the state a request is already in.
  const manualStatuses = MANUAL_ASSISTANCE_STATUSES.filter(status => (status !== "REJECTED" || request.status === "REJECTED") && (status !== "APPROVED" || request.status === "APPROVED") && (status !== "DOCUMENTS_REQUESTED" || request.status === "DOCUMENTS_REQUESTED"));
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
  const canApprove = hasPermission(user, "assistance.update") && hasPermission(user, "assistance.approve");
  const approvalOpen = !converted && ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"].includes(request.status);
  const routeChoices = ["PENDING", "REFERRED", "APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC", ...(verification?.decision === "DECLINED" ? ["DECLINED"] : [])];
  const invalid = (field: string) => approvalProblems.some(problem => approvalProblemField(problem) === field);
  const fieldAttrs = (field: string, hint?: string) => invalid(field)
    ? { "aria-invalid": true as const, "aria-describedby": [hint, `${field}-error`].filter(Boolean).join(" ") }
    : hint ? { "aria-describedby": hint } : {};
  const fieldError = (field: string) => {
    const problem = approvalProblems.find(item => approvalProblemField(item) === field);
    return problem ? <small id={`${field}-error`} className="form-error">{approvalProblemMessage(problem)}</small> : null;
  };
  const verificationLocked = !approvalOpen;

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">{request.referenceNumber}</p>
        <h1>{request.applicantName}</h1>
        <p className="muted">{request.category.replaceAll("_", " ")} · {request.city} · received {request.createdAt.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })}</p>
      </div>
      <span className="status-badge">{request.status.replaceAll("_", " ")}</span>
    </div>

    <Link className="button secondary" href={queueHref}>Return to assistance queue</Link>
    <nav className="filter-row" aria-label="Case review sections">
      <a href="#request-details-heading">Read intake</a>
      <a href="#private-documents-heading">Check evidence</a>
      <a href="#case-assignment-heading">Assign reviewer</a>
      {approvalOpen && <a href="#request-more-heading">Missing information</a>}
      <a href="#review-heading">Review verification</a>
      <a href="#case-lifecycle-heading">Support and closure evidence</a>
      {rejection !== "unknown" && <a href="#reject-heading">Rejection section</a>}
      <a href="#audit-history-heading">Recorded changes</a>
      <a href="#assistance-workflow-guide">Workflow guide</a>
    </nav>
    <div className="admin-detail-grid">
      <div className="grid">
        <details className="card">
          <summary><h2 id="reviewer-guide-heading">Reviewer guide</h2></summary>
          <ol>
            <li><strong>Review first:</strong> where the beneficiary lives (the applicant may be a representative elsewhere), then whether the need is severe hardship within current scope, then whether we can verify it locally.</li>
            <li><strong>Need more information:</strong> set Documents requested and ask only for what assessment needs, through the private channel, never in public comments.</li>
            <li><strong>Decline respectfully:</strong> reject with a reason category (outside service area, outside scope, insufficient information, unable to verify, duplicate, capacity unavailable, withdrawn, or other with a note). Rejection needs only a reason and a confirmation. Never describe an applicant as dishonest.</li>
            <li><strong>Duplicates:</strong> a shared phone number or similar text is a prompt for your judgement, not proof. Compare, then decide; do not decline on a match alone.</li>
            <li><strong>Acceptance is not publication:</strong> approving a request does not publish a story, name, photo or medical detail. Publication is a separate decision with its own consent review.</li>
            <li><strong>Capacity:</strong> the planning limit is 12 new individual cases a year, counted when a case is formally taken up, not when a request arrives or money is paid. Annual distributions and Taleem sponsorships are separate. Check workload before accepting; this limit is a maximum, not a promise.</li>
          </ol>
        </details>

        <section className="card">
          <h2 id="request-details-heading">Request details</h2>
          <dl className="details">
            <div><dt>Phone</dt><dd>{request.phone}</dd></div>
            <div><dt>Email</dt><dd>{request.email ?? "Not supplied"}</dd></div>
            <div className="full"><dt>Description</dt><dd>{request.description}</dd></div>
            <div><dt>Beneficiary lives (self-declared)</dt><dd>{residenceLabel(request.beneficiaryResidence)}</dd></div>
          </dl>
          {possibleDuplicates.length > 0 && <aside aria-label="Possible duplicate requests"><p><strong>Possible duplicates.</strong> Another request shares this phone number or email. This is a prompt for your judgement, not proof: compare before deciding, and do not decline on a match alone.</p><ul>{possibleDuplicates.map(other => <li key={other.id}><a href={assistanceCaseHref(other.id, returnFilters)}>{other.referenceNumber}</a> · {other.status} · {other.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</li>)}</ul></aside>}
        </section>

        <section className="card">
          <h2 id="private-documents-heading">Private documents</h2>
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
              <Link className="button secondary" href={queueHref}>Back to the queue</Link>
            </div>}
            {latestRejection
              ? <dl className="details">
                <div><dt>Recorded by</dt><dd> {latestRejection.rejectedBy.name}</dd></div>
                <div><dt>Recorded</dt><dd> {latestRejection.rejectedAt.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" })}</dd></div>
                <div className="full"><dt>Reason (private)</dt><dd> {latestRejection.reason}</dd></div>
              </dl>
              : <p>This request was rejected before reasons were recorded. No historical reason, reviewer or time is on file, and none has been invented.</p>}
            <p className="muted">To review it again, change its status under Review. Nothing is deleted, and an earlier decision stays on record.</p>
          </>}
          {rejection === "eligible" && (canReject ? <>
            <p className="muted">Enter the reason and confirm. You do not need to complete any approval check to reject a request, and nothing you have entered in the verification form is used or required.</p>
            <RejectRequestForm queueContext={queueContext} action={rejectRequestAction} requestId={id} referenceNumber={request.referenceNumber} requestVersion={request.updatedAt.toISOString()} verificationVersion={verification?.updatedAt.toISOString() ?? ""} notice={notice?.kind === "error" ? notice : null} draftReason={draftReason} />
          </> : <p className="muted">Only an authorised approver can reject a request. You can still save review notes; ask an approver to decide this case.</p>)}
        </section>}

        <section className="card">
          <h2 id="review-heading">Review and decision</h2>
          <p className="muted">Record verification, funding checks, disclosure permissions and Zakat review here. This information is internal and is not copied automatically into public appeal text. <strong>Save review progress</strong> keeps your work without deciding anything. <strong>Approve assistance</strong> completes the verification and approves the request in one step. Approval does not publish an appeal or transfer funds.</p>
          {approvalNotice?.kind === "done" && request.status === "APPROVED" && <div id="approve-heading" role="status" tabIndex={-1}>
            <h3>{approvalNotice.outcome === "approved" ? "Request approved" : "This request was already approved"}</h3>
            <p>{request.referenceNumber} is now <strong>Approved</strong>{approvalNotice.route ? ` as ${APPROVAL_ROUTES.find(route => route.value === approvalNotice.route)?.label.toLowerCase()}` : ""}. {approvalNotice.route === "APPROVED_PUBLIC" ? "Nothing has been published: prepare the public appeal below, then it goes through its own review and a separate publication decision." : "No public appeal is created."} Approved does not mean funds have been paid.</p>
          </div>}
          {approvalNotice?.kind === "error" && <div id="approve-errors" className="form-error" role="alert" tabIndex={-1}>
            <strong>{approvalProblems.length ? "There is a problem" : "This could not be approved"}</strong>
            {approvalProblems.length
              ? <ul>{approvalProblems.map(problem => <li key={problem}><a href={`#${approvalProblemField(problem)}`}>{approvalProblemMessage(problem)}</a></li>)}</ul>
              : <p>{APPROVAL_ERROR_MESSAGES[(approvalNotice.code ?? "form") as keyof typeof APPROVAL_ERROR_MESSAGES] ?? APPROVAL_ERROR_MESSAGES.form}</p>}
            {approvalProblems.length > 0 && <p className="muted">{approvalNotice.code ? "Review progress was not confirmed saved. Check the current review before trying again. Nothing has been approved." : "What you entered has been saved as review progress. Nothing has been approved."}</p>}
          </div>}
          <h3>What each support route means and needs</h3>
          <dl className="details">
            {APPROVAL_ROUTES.map(route => <div key={route.value} className="full"><dt>{route.label}</dt><dd>{route.meaning} {route.value === "APPROVED_PUBLIC" ? "Needs the approved public target and every disclosure permission decided, as well as the checks below." : "Needs the checks below only."}</dd></div>)}
          </dl>
          <ApprovalCheckAnswers approveAction={approveRequestWithFeedback} saveAction={saveReviewProgressWithFeedback}><AdminActionFeedbackForm action={saveReviewProgressWithFeedback}>
            {queueFields}
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedRequestUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="expectedVerificationUpdatedAt" value={verification?.updatedAt.toISOString() ?? ""}/>

            <label htmlFor="confidentialityLevel">Confidentiality level <span className="muted">({REQUIRED_TO_APPROVE})</span></label>
            <select id="confidentialityLevel" name="confidentialityLevel" defaultValue={verification?.confidentialityLevel ?? "CONFIDENTIAL"} disabled={verificationLocked}>
              {ASSISTANCE_CONFIDENTIALITY_LEVELS.map(value => <option key={value} value={value}>{label(value)}</option>)}
            </select>

            <label className="checkbox"><input id="needConfirmed" type="checkbox" name="needConfirmed" defaultChecked={verification?.needConfirmed ?? false} disabled={verificationLocked} {...fieldAttrs("needConfirmed")}/><span><strong>Need confirmed</strong> <span className="muted">({REQUIRED_TO_APPROVE})</span><small>The underlying charitable need has been verified.</small></span></label>
            {fieldError("needConfirmed")}
            <label className="checkbox"><input id="evidenceReviewed" type="checkbox" name="evidenceReviewed" defaultChecked={verification?.evidenceReviewed ?? false} disabled={verificationLocked} {...fieldAttrs("evidenceReviewed")}/><span><strong>Supporting evidence reviewed</strong> <span className="muted">({REQUIRED_TO_APPROVE})</span><small>Relevant private proof has been reviewed; do not publish the raw documents.</small></span></label>
            {fieldError("evidenceReviewed")}
            <label className="checkbox"><input id="otherFundingChecked" type="checkbox" name="otherFundingChecked" defaultChecked={verification?.otherFundingChecked ?? false} disabled={verificationLocked} {...fieldAttrs("otherFundingChecked")}/><span><strong>Other funding checked</strong> <span className="muted">({REQUIRED_TO_APPROVE})</span><small>Duplicate fundraising, concessions, insurance, government help or other major support has been considered.</small></span></label>
            {fieldError("otherFundingChecked")}

            <label htmlFor="verifiedNeedAmount">Verified need amount (₹) <span className="muted">({REQUIRED_TO_APPROVE})</span></label>
            <input id="verifiedNeedAmount" name="verifiedNeedAmount" type="text" inputMode="decimal" maxLength={40} pattern="^(?:0\.(?:0[1-9]|[1-9][0-9]?)|[1-9]\d*(?:\.\d{1,2})?)$" defaultValue={amountDraft.verifiedNeedAmount || verification?.verifiedNeedAmount?.toString() || ""} disabled={verificationLocked} {...fieldAttrs("verifiedNeedAmount")}/>
            {fieldError("verifiedNeedAmount")}

            <label htmlFor="approvedPublicTarget">Approved public fundraising target (₹) <span className="muted">(Required for public fundraising only; not needed for private or partial support)</span></label>
            <input id="approvedPublicTarget" name="approvedPublicTarget" type="text" inputMode="decimal" maxLength={40} pattern="^(?:0\.(?:0[1-9]|[1-9][0-9]?)|[1-9]\d*(?:\.\d{1,2})?)$" defaultValue={amountDraft.approvedPublicTarget || verification?.approvedPublicTarget?.toString() || ""} disabled={verificationLocked} {...fieldAttrs("approvedPublicTarget", "approvedPublicTarget-hint")}/>
            <small id="approvedPublicTarget-hint" className="muted">Positive rupees only; up to two decimal places. It cannot exceed the verified need, and must be left empty for private or partial support.</small>
            {fieldError("approvedPublicTarget")}

            <label htmlFor="paymentDestination">Payment destination <span className="muted">({REQUIRED_TO_APPROVE})</span></label>
            <input id="paymentDestination" name="paymentDestination" maxLength={600} defaultValue={verification?.paymentDestination ?? ""} placeholder="Hospital, vendor, beneficiary transfer, asset purchase, verified settlement…" disabled={verificationLocked} {...fieldAttrs("paymentDestination", "paymentDestination-hint")}/>
            <small id="paymentDestination-hint" className="muted">Where the assistance money goes for this case. This is not Amaana&apos;s own donation receiving account.</small>
            {fieldError("paymentDestination")}

            <label htmlFor="otherFundingNotes">Other funding / duplication notes <span className="muted">(Optional)</span></label>
            <textarea id="otherFundingNotes" name="otherFundingNotes" maxLength={2400} defaultValue={verification?.otherFundingNotes ?? ""} disabled={verificationLocked} {...fieldAttrs("otherFundingNotes")}/>
            {fieldError("otherFundingNotes")}

            <label htmlFor="verificationSummary">Verification summary <span className="muted">({REQUIRED_TO_APPROVE}; optional while you are only saving progress)</span></label>
            <textarea id="verificationSummary" name="verificationSummary" maxLength={5400} defaultValue={verification?.verificationSummary ?? ""} placeholder="Internal factual summary of what was checked and what is approved." disabled={verificationLocked} {...fieldAttrs("verificationSummary")}/>
            {fieldError("verificationSummary")}

            <label htmlFor="decision">Support route <span className="muted">(Choose one to approve; Not decided yet or Referred only save progress)</span></label>
            <select id="decision" name="decision" defaultValue={verification?.decision ?? "PENDING"} disabled={verificationLocked} {...fieldAttrs("decision")}>
              {routeChoices.map(value => <option key={value} value={value}>{ROUTE_CHOICE_LABEL[value] ?? label(value)}</option>)}
            </select>
            {fieldError("decision")}

            <label htmlFor="publicNameConsent">Public name permission <span className="muted">({REQUIRED_FOR_PUBLIC})</span></label>
            <select id="publicNameConsent" name="publicNameConsent" defaultValue={verification?.publicNameConsent ?? "UNCONFIRMED"} disabled={verificationLocked} {...fieldAttrs("publicNameConsent")}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{CONSENT_LABEL[value] ?? label(value)}</option>)}</select>
            {fieldError("publicNameConsent")}

            <label htmlFor="photoConsent">Photo/media permission <span className="muted">({REQUIRED_FOR_PUBLIC})</span></label>
            <select id="photoConsent" name="photoConsent" defaultValue={verification?.photoConsent ?? "UNCONFIRMED"} disabled={verificationLocked} {...fieldAttrs("photoConsent")}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{CONSENT_LABEL[value] ?? label(value)}</option>)}</select>
            {fieldError("photoConsent")}

            <label htmlFor="medicalDetailsConsent">Medical-detail disclosure permission <span className="muted">({REQUIRED_FOR_PUBLIC})</span></label>
            <select id="medicalDetailsConsent" name="medicalDetailsConsent" defaultValue={verification?.medicalDetailsConsent ?? "UNCONFIRMED"} disabled={verificationLocked} {...fieldAttrs("medicalDetailsConsent")}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{CONSENT_LABEL[value] ?? label(value)}</option>)}</select>
            {fieldError("medicalDetailsConsent")}

            <label htmlFor="institutionNameConsent">Hospital / institution naming permission <span className="muted">({REQUIRED_FOR_PUBLIC})</span></label>
            <select id="institutionNameConsent" name="institutionNameConsent" defaultValue={verification?.institutionNameConsent ?? "UNCONFIRMED"} disabled={verificationLocked} {...fieldAttrs("institutionNameConsent")}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{CONSENT_LABEL[value] ?? label(value)}</option>)}</select>
            {fieldError("institutionNameConsent")}

            <label htmlFor="archiveConsent">Public archive permission after closure <span className="muted">({REQUIRED_FOR_PUBLIC})</span></label>
            <select id="archiveConsent" name="archiveConsent" defaultValue={verification?.archiveConsent ?? "UNCONFIRMED"} disabled={verificationLocked} {...fieldAttrs("archiveConsent")}>{ASSISTANCE_CONSENT_DECISIONS.map(value => <option key={value} value={value}>{CONSENT_LABEL[value] ?? label(value)}</option>)}</select>
            {fieldError("archiveConsent")}
            <small className="muted">Unconfirmed means the question is not finished. Not allowed is a restriction. Not applicable means genuinely irrelevant. Hiding a field never answers it, and none of these is assumed.</small>

            <label htmlFor="zakatStatus">Zakat review <span className="muted">({REQUIRED_TO_APPROVE})</span></label>
            <select id="zakatStatus" name="zakatStatus" defaultValue={verification?.zakatStatus ?? "UNREVIEWED"} disabled={verificationLocked} {...fieldAttrs("zakatStatus", "zakatStatus-hint")}>{ASSISTANCE_ZAKAT_STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
            <small id="zakatStatus-hint" className="muted">Never infer Zakat eligibility. Choose Not applicable when the case is not being assessed for Zakat.</small>
            {fieldError("zakatStatus")}

            {approvalOpen && canApprove && <>
              {approvalNotice?.kind === "error" && approvalNotice.code === "capacity_full" && <fieldset>
                <legend>Capacity exception</legend>
                <label className="checkbox"><input type="checkbox" name="capacityException" /><span><strong>Accept this case beyond the annual planning limit</strong><small>Recorded in the audit history with your name.</small></span></label>
                <label htmlFor="capacityExceptionNote">Reason for the exception</label>
                <textarea id="capacityExceptionNote" name="capacityExceptionNote" rows={2} maxLength={1000} />
              </fieldset>}
              <label className="checkbox"><input id="confirmApproval" type="checkbox" name="confirmApproval" {...fieldAttrs("confirmApproval")}/><span><strong>I confirm I am approving this request on the support route chosen above</strong> <span className="muted">({REQUIRED_TO_APPROVE})</span><small>This completes the verification and marks the request Approved with your name on it. If the applicant gave an email address, the standard “status updated” message is queued (queued is not delivered). Approval is not payment, and for public fundraising it does not publish anything.</small></span></label>
              {fieldError("confirmApproval")}
            </>}
            {!canApprove && !verificationLocked && <small className="muted">You may save review progress, but only an authorised approver can approve a request.</small>}
            {verification?.completedAt && <small className="muted">Completed {verification.completedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} by {verification.reviewedBy?.name ?? "authorised reviewer"}.</small>}
            {verificationLocked && <small className="muted">Verification is locked while this request is approved, rejected, closed or linked to an appeal. Reopen the review through the status workflow before changing it.</small>}
            <button className="button secondary" data-save-review-progress="" disabled={!hasPermission(user, "assistance.update") || verificationLocked}>Save review progress</button>
            {approvalOpen && canApprove && <button className="button" type="submit" data-review-approval="" disabled formAction={approveRequestAction}>Approve assistance</button>}
          </AdminActionFeedbackForm><ApprovalSummary /></ApprovalCheckAnswers>

          {verification?.decision === "APPROVED_PUBLIC" && <div>
            <h3>Public appeal readiness</h3>
            {publicAppealReady ? <p className="muted">Verification and disclosure controls are complete for draft-appeal conversion. Public copy and media still require the normal appeal review before publication.</p> : <ul>{publicAppealIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
          </div>}
        </section>

        <section className="card" aria-labelledby="case-lifecycle-heading">
          <h2 id="case-lifecycle-heading">Support and closure evidence</h2>
          <p className="muted">These are separate recorded facts. Formal acceptance, a completed review, an appeal status and a closed request are not proof that assistance was delivered.</p>
          <dl className="details">
            <div><dt>Current request status</dt><dd>{label(request.status)}</dd></div>
            <div><dt>Formal acceptance on record</dt><dd>{evidenceDate(lifecycle.acceptedAt)}</dd></div>
            <div><dt>Recorded verification completion</dt><dd>{evidenceDate(lifecycle.verificationCompletedAt)}</dd></div>
            <div><dt>Saved support route</dt><dd>{lifecycle.route}</dd></div>
            <div><dt>Linked appeal status</dt><dd>{lifecycle.appealState}</dd></div>
            <div><dt>Latest recorded transition to Closed</dt><dd>{lifecycle.closure.kind === "recorded" ? evidenceDate(lifecycle.closure.at) : lifecycle.closure.kind === "unavailable" ? "Closure evidence temporarily unavailable" : lifecycle.closure.kind === "missing" ? "No reliable closure transition on record" : "Request is not currently Closed"}</dd></div>
            <div className="full"><dt>Delivery confirmation</dt><dd>Not established by these records. Review independently verified delivery evidence and any remaining obligations.</dd></div>
          </dl>
          {lifecycle.gaps.length > 0 && <div><h3>Evidence gaps to review</h3><ul>{lifecycle.gaps.map(gap => <li key={gap}>{lifecycleGapLabels[gap]}</li>)}</ul></div>}
          <p className="muted">Before closing a case, record the support actually delivered or the reason it ended, any outstanding commitments, and where authorised staff can verify private evidence. Do not publish documents, imply a payment was made, or infer a date from a note edit. This panel does not certify disbursement or change status.</p>
          {request.appeal && hasPermission(user, "appeal.view") && <p><Link href={`/admin/appeals/${request.appeal.id}`}>Review linked appeal separately</Link></p>}
        </section>

        <section className="card">
          <h2 id="audit-history-heading">Audit history</h2>
          {history === null ? <p role="status" className="muted">Audit history temporarily unavailable. This does not mean there are no recorded changes. You can continue reviewing this request.</p> : history.events.length ? <>
            <p className="muted">Showing {history.events.length} {historyBoundary ? "older" : "most recent"} recorded changes, newest first.</p>
            <ol className="history">{history.events.map(event => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.actor.name} · {event.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></li>)}</ol>
          </> : <p className="muted">{historyBoundary ? "No older changes on this page." : "No changes recorded yet."}</p>}
          {(historyBoundary || history?.older) && <nav className="filter-row" aria-label="Case audit history navigation">
            {historyBoundary && <a href={caseHistoryHref(id, returnFilters)}>Newest changes</a>}
            {history?.older && <a href={caseHistoryHref(id, returnFilters, history.older)}>Older changes</a>}
          </nav>}
        </section>
      </div>

      <aside className="grid">
        <section className="card">
          <h2 id="case-assignment-heading">Assignment</h2>
          <form action={assignRequest} className="field">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="assignedToId">Assigned staff member (Optional)</label>
            <select id="assignedToId" name="assignedToId" defaultValue={request.assignedToId ?? ""} aria-describedby={currentAssigneeUnavailable ? "assignment-availability" : undefined}><option value="">Unassigned</option>{currentAssigneeUnavailable && <option value={request.assignedToId!}>{`${request.assignedTo?.name ?? "Current staff member"} (currently unavailable)`}</option>}{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            {currentAssigneeUnavailable && <small id="assignment-availability" className="muted">The current assignee is unavailable for assignment. Choose an available staff member or Unassigned before saving a change.</small>}
            <button className="button secondary" disabled={!hasPermission(user, "assistance.assign")}>Save assignment</button>
          </form>
        </section>

        {!converted && ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"].includes(request.status) && <section className="card" aria-labelledby="request-more-heading">
          <h2 id="request-more-heading">Request additional information</h2>
          <p className="muted">{request.status === "DOCUMENTS_REQUESTED" ? "Awaiting information from applicant. Record any remaining questions, then resume verification when private evidence has been reviewed." : "Use this when specific details or evidence are missing and the application is not ready for a decision."}</p>
          <AdminActionFeedbackForm action={updateRequestWithFeedback}>
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <input type="hidden" name="status" value="DOCUMENTS_REQUESTED"/>
            <label htmlFor="followUpNotes">Specific missing items or questions (Required)</label>
            <textarea id="followUpNotes" name="internalNotes" minLength={10} maxLength={10000} required defaultValue={request.internalNotes ?? ""} aria-describedby="follow-up-instructions"/>
            <small id="follow-up-instructions" className="muted">List the specific missing items in this private case note. Saving changes the status and may queue a standard status notification, but it does not send these questions to the applicant.</small>
            <button className="button secondary" disabled={!hasPermission(user, "assistance.update")}>{request.status === "DOCUMENTS_REQUESTED" ? "Save follow-up details" : "Mark awaiting information"}</button>
          </AdminActionFeedbackForm>
          <p className="muted">After saving, contact the applicant through a verified private channel using the request reference. No applicant upload or reply portal is available. Do not collect sensitive evidence through social media or unverified contact methods.</p>
        </section>}

        <section className="card">
          <h2>Review</h2>
          <AdminActionFeedbackForm action={updateRequestWithFeedback}>
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="expectedUpdatedAt" value={request.updatedAt.toISOString()}/>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={request.status} disabled={converted}>{visibleStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
            {converted && <input type="hidden" name="status" value="CONVERTED_TO_APPEAL"/>}
            <label htmlFor="internalNotes">Internal notes</label>
            <small className="muted">Optional for ordinary review; retain specific missing items while awaiting information.</small>
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
            {queueFields}
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
    <section className="card" aria-labelledby="assistance-workflow-guide">
      <h2 id="assistance-workflow-guide">Review workflow guide</h2>
      <p className="muted">Follow these steps for every financial or medical request. Only verified information may be approved; an application does not guarantee funding.</p>
      <ol>
        <li><strong>1. Read the intake and private evidence.</strong> Confirm the applicant&apos;s contact details, request description and any documents. Assign a reviewer if needed. Submitted files are not automatically approved for public sharing.</li>
        <li><strong>2. If information is missing, request it privately.</strong> Use Request additional information, list the exact missing items in the private note, change the status to Documents requested, then contact the applicant through a verified private channel. The standard status email is not the detailed request. Once received and verified, resume verification.</li>
        <li><strong>3. Decide: approve or reject.</strong> Approval requires confirmed need, reviewed evidence, verified amount, payment destination, checked other funding, a verification summary and a Zakat decision. Public fundraising also requires a target and separately resolved disclosure permissions. Internal notes and assignment are optional. To reject, use Reject request with a private reason and explicit confirmation; approval fields are not required.</li>
        <li><strong>4. Prepare public fundraising only when approved for that route.</strong> Create a draft appeal and separately review the public story, consent, privacy-safe media and payment eligibility. Publishing the appeal is a distinct decision; approval alone never transfers funds or opens fundraising.</li>
        <li><strong>5. Follow up and close with evidence.</strong> Review the Support and closure evidence section. Confirm actual delivery or why support ended, outstanding commitments and any linked appeal status separately. Closing collection or recording a closed request alone does not establish that assistance was delivered.</li>
      </ol>
    </section>
  </>;
}
