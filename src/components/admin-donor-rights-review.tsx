import { AdminActionForm, AdminActionButton } from "./admin-action-form";
import { reviewDonorRightsAction, type RightsReviewState } from "@/app/admin/(protected)/donations/rights/actions";
import { DONOR_RIGHTS_REVIEW_OUTCOMES } from "@/lib/donor-rights";

const initial: RightsReviewState = { state: "idle", message: "" };
export function AdminDonorRightsReview({ requestId, status }: {
  requestId: string; status: "OPEN" | "IN_REVIEW";
}) {
  return <AdminActionForm action={reviewDonorRightsAction} initial={initial}>
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
    <AdminActionButton type="submit" className="button"
      name="decision" value={status === "OPEN" ? "START_REVIEW" : "CLOSE_REVIEW"}>
      {status === "OPEN" ? "Take into review" : "Close reviewed request"}
    </AdminActionButton>
  </AdminActionForm>;
}
