"use client";

import { useActionState } from "react";
import { reverseAllocationAction, type AllocationActionResult } from "@/app/admin/(protected)/allocations/actions";
const initial: AllocationActionResult = { state: "idle", message: "" };
export function AdminAllocationReversal({ proposalId }: { proposalId: string }) {
  const [result, action, pending] = useActionState(reverseAllocationAction, initial);
  return <details>
    <summary>Review an append-only planning reversal</summary>
    <form action={action} className="form-grid" aria-busy={pending}>
      <input type="hidden" name="proposalId" value={proposalId}/>
      <div className="field full">
        <label htmlFor={`reason-${proposalId}`}>Reason for reversing this internal allocation</label>
        <textarea id={`reason-${proposalId}`} name="reason" required minLength={20}
          maxLength={240} aria-describedby={`reversal-help-${proposalId}`}/>
        <p id={`reversal-help-${proposalId}`} className="muted">State the finance governance reason only. Exclude private beneficiary details. The original approved proposal will remain visible and an additional reversal entry will be created.</p>
      </div>
      <div className="field full"><button type="submit" className="text-button" disabled={pending}>Record independent reversal</button></div>
      {result.state !== "idle" && <p className="field full" role={result.state === "error" ? "alert" : "status"}>{result.message}</p>}
      <p className="muted field full">This only changes internal planning availability. It does not issue a donor refund, disbursement, receipt or bank instruction.</p>
    </form>
  </details>;
}
