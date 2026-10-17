import { AdminActionForm, AdminActionButton } from "./admin-action-form";
import { reconcileDonationAction, type DonationReconciliationState } from "@/app/admin/(protected)/donations/actions";

const initialState: DonationReconciliationState = { status: "idle", message: "" };

/** This form collects staff attestation; it never represents a provider-backed
 * bank feed or an independent second approver. The server verifies everything
 * again before entering CAPTURED. */
export function AdminDirectTransferForm({ donationId }: { donationId: string }) {
  return <AdminActionForm action={reconcileDonationAction} initial={initialState} messageClassName="field full" announce afterFeedback={<>
    <div className="field full">
      <AdminActionButton className="button" type="submit" name="decision" value="VERIFY" pendingLabel="Processing review…">
        Verify received transfer
      </AdminActionButton>{" "}
      <AdminActionButton className="text-button" type="submit" name="decision" value="REJECT"
        formNoValidate>Reject unverified claim</AdminActionButton>
    </div>
    <p className="muted field full">Verify creates a financial credit only after the server confirms
      the exact recorded reference and amount. Rejection never creates a receipt or a credit.</p>
  </>}>
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
  </AdminActionForm>;
}
