"use client";

import { useActionState } from "react";
import { reissueReceiptLinkAction, type ReissueLinkState } from "../actions";

/** Staff-only. Reissuing replaces the donor's private acknowledgement link; the previous link stops working at once. */
export function ReceiptLinkReissue({ donationId }: { donationId: string }) {
  const [state, action, pending] = useActionState<ReissueLinkState, FormData>(reissueReceiptLinkAction, null);
  return (
    <>
      <h2>Private acknowledgement link</h2>
      <p className="muted">If a donor lost their link, reissue it. The old link stops working immediately. Send the new one only through a channel you have verified for this donor, such as the phone number or email on this record.</p>
      <form action={action} className="form-grid">
        <input type="hidden" name="donationId" value={donationId} />
        <div className="field full">
          <label htmlFor="reissue-reason">Reason (kept in the audit trail)</label>
          <textarea id="reissue-reason" name="reason" minLength={3} maxLength={300} required disabled={pending} />
        </div>
        <div className="field full"><button className="button" type="submit" disabled={pending}>{pending ? "Reissuing…" : "Reissue private link"}</button></div>
      </form>
      <div role="status" aria-live="polite">
        {state?.ok === false ? <p className="form-error" role="alert">{state.error}</p> : null}
        {state?.ok === true ? (
          <>
            <p><strong>New link for {state.reference}.</strong> It is shown once and is not stored; copy it now.</p>
            <input readOnly value={state.link} aria-label={`New private link for ${state.reference}`} onFocus={event => event.currentTarget.select()} />
          </>
        ) : null}
      </div>
    </>
  );
}
