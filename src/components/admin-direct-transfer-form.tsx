"use client";

import { useActionState } from "react";
import { reconcileDonationAction, type DonationReconciliationState } from "@/app/admin/(protected)/donations/actions";

const initialState: DonationReconciliationState = { status: "idle", message: "" };

/** This form collects staff attestation; it never represents a provider-backed
 * bank feed or an independent second approver. The server verifies everything
 * again before entering CAPTURED. */
export function AdminDirectTransferForm({ donationId }: { donationId: string }) {
  const [state, formAction, pending] = useActionState(reconcileDonationAction, initialState);

  return <form action={formAction} className="form-grid" aria-busy={pending}>
    <input type="hidden" name="donationId" value={donationId} />
    <div className="field full">
      <label htmlFor="notes">Reconciliation notes</label>
      <textarea id="notes" name="notes" minLength={3} maxLength={1000} required
        aria-describedby="reconciliation-notes-help" />
      <p id="reconciliation-notes-help" className="muted">
        Record the source and date of verification or the reason for rejection.
      </p>
    </div>
    <fieldset className="field full">
      <legend>Bank-statement match — required to verify, not to reject</legend>
      <p className="muted">Check Amaana&apos;s own bank or UPI statement, not the donor&apos;s screenshot.
        Confirm the exact credited amount and transaction reference. This is a staff attestation,
        not an automatic bank connection.</p>
      <div className="field">
        <label htmlFor="statementReference">Statement transaction reference</label>
        <input id="statementReference" name="statementReference" type="text" autoComplete="off"
          maxLength={100} required pattern={"[A-Za-z0-9._\\/\\-]{6,100}"} />
      </div>
      <div className="field">
        <label htmlFor="statementAmount">Statement credit (INR)</label>
        <input id="statementAmount" name="statementAmount" type="text" inputMode="decimal"
          autoComplete="off" placeholder="500.00" required
          pattern={"(0|[1-9][0-9]{0,11})(\\.[0-9]{1,2})?"} />
      </div>
      <label className="checkbox-row">
        <input name="statementConfirmed" type="checkbox" value="true" required />
        I personally confirmed both fields against Amaana&apos;s received bank credit.
      </label>
    </fieldset>
    {state.status !== "idle" && <p role={state.status === "error" ? "alert" : "status"}
      className="field full" aria-live={state.status === "error" ? "assertive" : "polite"}>
      {state.message}
    </p>}
    <div className="field full">
      <button className="button" type="submit" name="decision" value="VERIFY" disabled={pending}>
        {pending ? "Processing review…" : "Verify received transfer"}
      </button>{" "}
      <button className="text-button" type="submit" name="decision" value="REJECT"
        formNoValidate disabled={pending}>Reject unverified claim</button>
    </div>
    <p className="muted field full">Verify creates a financial credit only after the server confirms
      the exact recorded reference and amount. Rejection never creates a receipt or a credit.</p>
  </form>;
}
