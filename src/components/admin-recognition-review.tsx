"use client";
import { useActionState } from "react";
import { reviewDonorRecognitionAction, type RecognitionReviewState } from "@/app/admin/(protected)/donations/recognition/actions";
const initial: RecognitionReviewState = { status: "idle", message: "" };

export function AdminRecognitionReview({ donationId, requestedAt, displayName }: {
  donationId: string; requestedAt: string; displayName: string;
}) {
  const [state, action, pending] = useActionState(reviewDonorRecognitionAction, initial);
  return <form action={action} aria-busy={pending}>
    <input type="hidden" name="donationId" value={donationId}/>
    <input type="hidden" name="requestedAt" value={requestedAt}/>
    <input type="hidden" name="name" value={displayName}/>
    <p>Review the name for personal identifiers and confirm this is a donor-initiated request. Payment anonymity and refund eligibility must still pass the server check.</p>
    <button className="button" type="submit" name="decision" value="APPROVE" disabled={pending}>Approve name only</button>{" "}
    <button className="text-button" type="submit" name="decision" value="REJECT" disabled={pending}>Reject request</button>
    {state.status !== "idle" && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
