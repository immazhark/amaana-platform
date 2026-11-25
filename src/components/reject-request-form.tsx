import { ASSISTANCE_DECLINE_REASONS } from "@/lib/assistance-policy";
import { REJECTION_ERROR_MESSAGES, rejectionProblemMessage, type RejectionNotice, type RejectionProblem } from "@/lib/assistance-rejection";

export type RejectRequestFormProps = {
  /** The rejection server action. The form posts to it directly, so no client JavaScript is involved. */
  action: (formData: FormData) => void | Promise<void>;
  requestId: string;
  referenceNumber: string;
  requestVersion: string;
  verificationVersion: string;
  /** The error notice from the address, if the last attempt did not go through. */
  notice: Extract<RejectionNotice, { kind: "error" }> | null;
  /** What the reviewer typed last time, so a recoverable error does not make them retype it. */
  draftReason: string;
};

const reasonProblem = (problems: RejectionProblem[]) => problems.find(problem => problem !== "confirmation") ?? null;

/**
 * The one way to reject an assistance request: a reason and an explicit confirmation, nothing else. Approval fields are
 * not part of this form, so they cannot block it. It is plain server-rendered HTML that posts to a server action, so it
 * needs no client JavaScript and works if scripts fail to load. After an error the page comes back with every problem
 * listed together in a summary that links to the fields (the address carries a fragment that moves focus to it), the
 * fields marked and described, and what was typed kept. A double submission is safe because the decision is recorded once.
 */
export function RejectRequestForm({ action, requestId, referenceNumber, requestVersion, verificationVersion, notice, draftReason }: RejectRequestFormProps) {
  const problems = notice?.problems ?? [];
  const reasonError = reasonProblem(problems);
  const confirmError = problems.includes("confirmation");
  const refusal = notice && !problems.length ? REJECTION_ERROR_MESSAGES[(notice.code ?? "form") as keyof typeof REJECTION_ERROR_MESSAGES] ?? REJECTION_ERROR_MESSAGES.form : null;
  const listed = [
    reasonError ? { href: "#reject-reason", text: rejectionProblemMessage(reasonError) } : null,
    confirmError ? { href: "#reject-confirm", text: rejectionProblemMessage("confirmation") } : null,
  ].filter((item): item is { href: string; text: string } => item !== null);

  return (
    <form action={action} className="field" noValidate>
      <input type="hidden" name="id" value={requestId} />
      <input type="hidden" name="expectedRequestUpdatedAt" value={requestVersion} />
      <input type="hidden" name="expectedVerificationUpdatedAt" value={verificationVersion} />

      {notice && (
        <div id="reject-errors" className="form-error" role="alert" tabIndex={-1}>
          <strong>{listed.length ? "There is a problem" : "This could not be rejected"}</strong>
          {listed.length
            ? <ul>{listed.map(item => <li key={item.href}><a href={item.href}>{item.text}</a></li>)}</ul>
            : <p>{refusal}</p>}
        </div>
      )}

      <label htmlFor="reject-reason-code">Reason category <span className="muted">(Optional; choose “Other” if none fits)</span></label>
      <select id="reject-reason-code" name="reasonCode" defaultValue="">
        <option value="">No category</option>
        {ASSISTANCE_DECLINE_REASONS.map(reason => <option key={reason.code} value={reason.code}>{reason.label}</option>)}
      </select>
      <label htmlFor="reject-reason">Reason for rejection <span className="muted">(Required unless a category above explains it)</span></label>
      <small id="reject-reason-hint" className="muted">
        Say plainly why this request is being declined, for example “Duplicate of AF-2026-100000” or “Not eligible for assistance”. Up to 2000 characters. Kept privately; not sent to the applicant.
      </small>
      <textarea
        id="reject-reason" name="reason" rows={4} maxLength={2400} required defaultValue={draftReason}
        aria-invalid={reasonError ? true : undefined}
        aria-describedby={reasonError ? "reject-reason-hint reject-reason-error" : "reject-reason-hint"}
      />
      {reasonError && <p id="reject-reason-error" className="form-error">{rejectionProblemMessage(reasonError)}</p>}

      <label className="checkbox" htmlFor="reject-confirm">
        <input
          id="reject-confirm" type="checkbox" name="confirmRejection" aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? "reject-confirm-error" : undefined}
        />
        <span>
          <strong>I confirm I am rejecting request {referenceNumber}</strong> <span className="muted">(Required to reject)</span>
          <small>The request is marked Rejected and the reason above is recorded with your name. If the applicant gave an email address, the standard “status updated” message is queued; it does not include your reason, and queued is not the same as delivered.</small>
        </span>
      </label>
      {confirmError && <p id="reject-confirm-error" className="form-error">{rejectionProblemMessage("confirmation")}</p>}

      <button className="button" type="submit">Confirm rejection</button>
      <small className="muted">Nothing else on this page needs to be filled in to reject a request.</small>
    </form>
  );
}
