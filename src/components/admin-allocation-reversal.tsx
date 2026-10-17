import { AdminActionForm, AdminActionButton } from "./admin-action-form";
import { reverseAllocationAction, type AllocationActionResult } from "@/app/admin/(protected)/allocations/actions";
const initial: AllocationActionResult = { state: "idle", message: "" };
export function AdminAllocationReversal({ proposalId }: { proposalId: string }) {
  return <details>
    <summary>Review an append-only planning reversal</summary>
    <AdminActionForm action={reverseAllocationAction} initial={initial} messageClassName="field full" afterFeedback={<p className="muted field full">This only changes internal planning availability. It does not issue a donor refund, disbursement, receipt or bank instruction.</p>}>
      <input type="hidden" name="proposalId" value={proposalId}/>
      <div className="field full">
        <label htmlFor={`reason-${proposalId}`}>Reason for reversing this internal allocation</label>
        <textarea id={`reason-${proposalId}`} name="reason" required minLength={20}
          maxLength={240} aria-describedby={`reversal-help-${proposalId}`}/>
        <p id={`reversal-help-${proposalId}`} className="muted">State the finance governance reason only. Exclude private beneficiary details. The original approved proposal will remain visible and an additional reversal entry will be created.</p>
      </div>
      <div className="field full"><AdminActionButton type="submit" className="text-button">Record independent reversal</AdminActionButton></div>
    </AdminActionForm>
  </details>;
}
