"use client";
import { useActionState } from "react";
import { submitIndexNowAction, type IndexNowActionState } from "@/app/admin/(protected)/media/indexnow-action";
const initial: IndexNowActionState = { state: "idle", message: "" };
export function AdminIndexNowSubmission() {
  const [state, action, pending] = useActionState(submitIndexNowAction, initial);
  return <form action={action} className="form-grid" aria-busy={pending}>
    <label className="field full" htmlFor="indexnow-paths">Changed public page paths
      <textarea id="indexnow-paths" name="paths" rows={5} maxLength={12000} required placeholder={'/about\n/our-work'} aria-describedby="indexnow-path-help"/>
    </label>
    <p id="indexnow-path-help" className="muted">One canonical path per line, up to 100. Every page must still be in the public sitemap. Private pages, receipt links, individual appeals and withdrawn content are excluded. This action does not remove existing search results.</p>
    <label className="checkbox-row"><input name="confirmPublic" type="checkbox" value="true" required/>
      I reviewed these pages and approve notifying participating search engines of their public updates.
    </label>
    <button type="submit" className="button" disabled={pending || state.state === "uncertain"}>Notify search engines</button>
    {state.state !== "idle" && <p role={state.state === "success" ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
