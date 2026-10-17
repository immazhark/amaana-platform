import { AdminActionForm, AdminActionButton } from "./admin-action-form";
import { createAllocationAction, type AllocationActionResult } from "@/app/admin/(protected)/allocations/actions";
const initial: AllocationActionResult = { state: "idle", message: "" };

export function AllocationProposalForm({ donationId }: { donationId: string }) {
  return <AdminActionForm action={createAllocationAction} initial={initial} messageClassName="field full" afterFeedback={<p className="muted field full">Proposals and approvals are internal governance records, not proof of disbursement, an expenditure voucher or a bank transfer.</p>}>
    <input type="hidden" name="donationId" value={donationId}/>
    <div className="field">
      <label htmlFor="allocation-amount">Proposed allocation (INR)</label>
      <input id="allocation-amount" type="text" name="amount" required inputMode="decimal"
        pattern="(0|[1-9][0-9]{0,6})(\\.[0-9]{1,2})?" placeholder="2500.00"
        aria-describedby="allocation-amount-help" autoComplete="off"/>
      <p id="allocation-amount-help" className="muted">Must fit the retained, unallocated donation balance. Pending proposals do not reserve money.</p>
    </div>
    <div className="field full">
      <label htmlFor="allocation-purpose">Approved fund use (not beneficiary identity)</label>
      <textarea id="allocation-purpose" name="purposeNote" minLength={15} maxLength={240}
        required aria-describedby="allocation-purpose-help"/>
      <p id="allocation-purpose-help" className="muted">Describe permitted programme expenditure only. Do not enter a person&apos;s medical, financial or identifying information.</p>
    </div>
    <div className="field full">
      <AdminActionButton type="submit" className="button">Propose allocation for review</AdminActionButton>
    </div>
  </AdminActionForm>;
}
