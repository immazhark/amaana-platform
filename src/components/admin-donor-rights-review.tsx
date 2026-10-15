"use client";

import { useActionState } from "react";
import { reviewDonorRightsAction, type RightsReviewState } from "@/app/admin/(protected)/donations/rights/actions";
import { DONOR_RIGHTS_REVIEW_OUTCOMES } from "@/lib/donor-rights";

const initial: RightsReviewState = { state: "idle", message: "" };
export function AdminDonorRightsReview({ requestId, status }: {
  requestId: string; status: "OPEN" | "IN_REVIEW";
}) {
  const [state, action, pending] = useActionState(reviewDonorRightsAction, initial);
  return <form className="form-grid" action={action} aria-busy={pending}>
    <input type="hidden" name="requestId" value={requestId}/>
    {status === "IN_REVIEW" && <label className="field">
      Documented review outcome
      <select name="resolution" defaultValue="" required>
        <option value="" disabled>Choose the completed review outcome</option>
        {DONOR_RIGHTS_REVIEW_OUTCOMES.map(item =>
          <option value={item.id} key={item.id}>{item.label}</option>)}
      </select>
    </label>}
    {status === "IN_REVIEW" && <label className="checkbox-row">
      <input name="reviewConfirmed" type="checkbox" value="true" required/>
      I personally reviewed this request, followed the appropriate private process, and confirmed any necessary donor response or escalation outside this form.
    </label>}
    <button type="submit" className="button" disabled={pending}
      name="decision" value={status === "OPEN" ? "START_REVIEW" : "CLOSE_REVIEW"}>
      {status === "OPEN" ? "Take into review" : "Close reviewed request"}
    </button>
    {state.state !== "idle" && <p role={state.state === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
