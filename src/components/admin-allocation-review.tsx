"use client";

import { useActionState } from "react";
import { reviewAllocationAction, type AllocationActionResult } from "@/app/admin/(protected)/allocations/actions";
const initial: AllocationActionResult = { state: "idle", message: "" };
export function AdminAllocationReview({ proposalId }: { proposalId: string }) {
  const [result, action, pending] = useActionState(reviewAllocationAction, initial);
  return <form action={action} className="form-grid" aria-busy={pending}>
    <input name="proposalId" type="hidden" value={proposalId}/>
    <p className="muted">Confirm the original donor purpose, net retained funds, existing approvals and independent maker/checker identity before acting.</p>
    <div className="field full">
      <button type="submit" name="decision" value="APPROVE" className="button" disabled={pending}>Approve internal allocation</button>{" "}
      <button type="submit" name="decision" value="REJECT" className="text-button" disabled={pending}>Reject proposal</button>
    </div>
    {result.state !== "idle" && <p role={result.state === "error" ? "alert" : "status"} className="field full">{result.message}</p>}
  </form>;
}
