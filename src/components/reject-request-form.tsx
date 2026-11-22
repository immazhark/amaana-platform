"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type { RejectionFormState } from "@/app/admin/(protected)/requests/[id]/rejection-actions";

const initial: RejectionFormState = { kind: "idle", message: "" };

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" }) : null;

/**
 * The one way to reject an assistance request: a reason and an explicit confirmation, nothing else. Approval fields are
 * not part of this form, so they cannot block it. Every actionable error is listed together in a summary that links to
 * the fields, the fields carry their own errors, what the reviewer typed comes back after an error, and the button is
 * disabled while the decision is being recorded so a double click cannot send it twice.
 */
export type RejectRequestFormProps = {
  requestId: string;
  referenceNumber: string;
  requestVersion: string;
  verificationVersion: string;
  queueHref?: string;
};

export function RejectRequestForm({ action, ...props }: RejectRequestFormProps & { action: (previous: RejectionFormState, data: FormData) => Promise<RejectionFormState> }) {
  const [state, formAction, pending] = useActionState(action, initial);
  return <RejectRequestFormView {...props} state={state} formAction={formAction} pending={pending} />;
}

/** The form for a given state. Exported so every state (error, success, pending) can be rendered and checked directly. */
export function RejectRequestFormView({
  requestId, referenceNumber, requestVersion, verificationVersion, queueHref = "/admin", state, formAction, pending,
}: RejectRequestFormProps & { state: RejectionFormState; formAction: (data: FormData) => void; pending: boolean }) {
  const summary = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLHeadingElement>(null);

  // Move focus to what the reviewer needs next: the problems after an error, the outcome after a decision.
  useEffect(() => {
    if (state.kind === "error") summary.current?.focus();
    if (state.kind === "success") done.current?.focus();
  }, [state]);

  if (state.kind === "success" && state.result) {
    const time = when(state.result.rejectedAt);
    return (
      <div role="status">
        <h3 ref={done} tabIndex={-1}>{state.result.outcome === "rejected" ? "Request rejected" : "This request was already rejected"}</h3>
        <p>
          {referenceNumber} is now <strong>Rejected</strong>.
          {state.result.reviewerName && time ? ` Recorded by ${state.result.reviewerName} on ${time}.` : time ? ` Recorded on ${time}.` : " The earlier decision has no recorded time or reviewer."}
        </p>
        <p className="muted">Your reason is kept privately with the request. It is not sent to the applicant.</p>
        <Link className="button secondary" href={queueHref}>Back to the queue</Link>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const listed = [
    errors.reason ? { href: "#reject-reason", text: errors.reason } : null,
    errors.confirmation ? { href: "#reject-confirm", text: errors.confirmation } : null,
  ].filter((item): item is { href: string; text: string } => item !== null);

  return (
    <form action={formAction} aria-busy={pending} noValidate>
      <input type="hidden" name="id" value={requestId} />
      <input type="hidden" name="expectedRequestUpdatedAt" value={requestVersion} />
      <input type="hidden" name="expectedVerificationUpdatedAt" value={verificationVersion} />

      {state.kind === "error" && (
        <div ref={summary} className="form-error" role="alert" tabIndex={-1}>
          <strong>{listed.length ? "There is a problem" : "This could not be rejected"}</strong>
          {listed.length ? <ul>{listed.map(item => <li key={item.href}><a href={item.href}>{item.text}</a></li>)}</ul> : <p>{state.message}</p>}
        </div>
      )}

      <label htmlFor="reject-reason">Reason for rejection <span className="muted">(Required to reject)</span></label>
      <small id="reject-reason-hint" className="muted">
        Say plainly why this request is being declined, for example “Duplicate of AF-2026-100000” or “Not eligible for assistance”. Up to 2000 characters. Kept privately; not sent to the applicant.
      </small>
      <textarea
        id="reject-reason" name="reason" rows={4} maxLength={2400} required defaultValue={state.values?.reason ?? ""}
        aria-invalid={errors.reason ? true : undefined}
        aria-describedby={errors.reason ? "reject-reason-hint reject-reason-error" : "reject-reason-hint"}
      />
      {errors.reason && <p id="reject-reason-error" className="form-error">{errors.reason}</p>}

      <label className="checkbox" htmlFor="reject-confirm">
        <input
          id="reject-confirm" type="checkbox" name="confirmRejection" aria-invalid={errors.confirmation ? true : undefined}
          aria-describedby={errors.confirmation ? "reject-confirm-error" : undefined}
        />
        <span>
          <strong>I confirm I am rejecting request {referenceNumber}</strong> <span className="muted">(Required to reject)</span>
          <small>The request is marked Rejected and the reason above is recorded with your name. If the applicant gave an email address, the standard “status updated” message is queued; it does not include your reason, and queued is not the same as delivered.</small>
        </span>
      </label>
      {errors.confirmation && <p id="reject-confirm-error" className="form-error">{errors.confirmation}</p>}

      <button className="button" type="submit" disabled={pending}>{pending ? "Recording rejection…" : "Confirm rejection"}</button>
      <small className="muted">Nothing else on this page needs to be filled in to reject a request.</small>
    </form>
  );
}
