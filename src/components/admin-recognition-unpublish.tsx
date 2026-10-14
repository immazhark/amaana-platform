"use client";

import { useActionState } from "react";
import { unpublishDonorRecognitionAction } from "@/app/admin/(protected)/donations/recognition/revoke-action";
import type { RecognitionReviewState } from "@/app/admin/(protected)/donations/recognition/actions";

const initial: RecognitionReviewState = { status: "idle", message: "" };
export function AdminRecognitionUnpublish({ donationId, displayName, approvedAt, requestedAt }: {
  donationId: string; displayName: string; approvedAt: string; requestedAt: string;
}) {
  const [state, action, pending] = useActionState(unpublishDonorRecognitionAction, initial);
  return <form action={action} aria-busy={pending}>
    <input type="hidden" name="donationId" value={donationId}/>
    <input type="hidden" name="name" value={displayName}/>
    <input type="hidden" name="approvedAt" value={approvedAt}/>
    <input type="hidden" name="requestedAt" value={requestedAt}/>
    <button className="text-button" type="submit" disabled={pending}>Unpublish this donor name</button>
    {state.status !== "idle" && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
