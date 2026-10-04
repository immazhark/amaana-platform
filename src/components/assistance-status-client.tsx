"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PrivateTrackingCredentials } from "@/lib/private-tracking";
import { usePrivateTrackingCredentials } from "@/lib/use-private-tracking-credentials";

type TrackingRecord = {
  found: true;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TrackingResponse = TrackingRecord | { found: false };

const statusLabels: Record<string, string> = {
  SUBMITTED: "Submitted",
  DOCUMENTS_REQUESTED: "Documents requested",
  UNDER_VERIFICATION: "Under verification",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  CONVERTED_TO_APPEAL: "Converted to appeal",
  CLOSED: "Closed",
};

const statusCopy: Record<string, string> = {
  SUBMITTED: "Your request has been received and is waiting for review.",
  DOCUMENTS_REQUESTED: "The team needs additional supporting information before review can continue.",
  UNDER_VERIFICATION: "The information supplied is currently being reviewed and verified.",
  APPROVED: "The request has passed the current review stage. The team will communicate the next step directly.",
  REJECTED: "The request was not approved. Any available explanation or follow-up will be communicated through the contact details supplied.",
  CONVERTED_TO_APPEAL: "The request has progressed into Amaana’s approved appeal workflow.",
  CLOSED: "This request is now closed.",
};

export function AssistanceStatusClient() {
  const credentials = usePrivateTrackingCredentials();
  const [snapshot, setResult] = useState<{ credentials: PrivateTrackingCredentials; record: TrackingRecord | null; failed: boolean }>();
  const result = snapshot?.credentials === credentials ? snapshot : undefined;
  const [retry, setRetry] = useState(0);
  const record = result?.record;

  useEffect(() => {
    if (credentials === undefined) return;
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (!credentials) return;

    const controller = new AbortController();
    void fetch("/api/assistance/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error("Tracking service unavailable");
        return await response.json() as TrackingResponse;
      })
      .then(response => { if (!controller.signal.aborted) setResult({ credentials, record: response.found ? response : null, failed: false }); })
      .catch(error => {
        if (!controller.signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) setResult({ credentials, record: null, failed: true });
      });

    return () => controller.abort();
  }, [credentials, retry]);

  const loading = credentials === undefined || (Boolean(credentials) && result === undefined);
  const title = loading
    ? "Checking your private request…"
    : result?.failed
      ? "Unable to check your request"
      : record
      ? statusLabels[record.status] ?? record.status
      : "Tracking link unavailable";

  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid" aria-busy={loading}><div><p className="v2-section-label">Private request tracking</p><h1 aria-live="polite" aria-atomic="true">{title}</h1>{loading ? <p>Confirming the private tracking details in this browser.</p> : result?.failed ? <p>We could not reach the tracking service. Your link has been kept privately in this tab. Try again without submitting a new request.</p> : record ? <><p>{statusCopy[record.status] ?? "Your request status has been updated."}</p><div className="v2-reference-block"><span>Reference</span><strong>{credentials?.reference}</strong><small>Submitted {new Date(record.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })} · Last updated {new Date(record.updatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</small></div></> : <p>This tracking link is incomplete, invalid or no longer available. For privacy, no request details are shown without a valid reference and token.</p>}<div className="v2-hero-actions">{loading ? null : result?.failed ? <button className="v2-button" type="button" onClick={() => { setResult(undefined); setRetry(value => value + 1); }}>Try tracking again</button> : record ? <Link className="v2-button" href="/contact">Contact Amaana</Link> : <Link className="v2-button" href="/request-assistance">Start a new request</Link>}<Link className="v2-text-link" href="/how-we-verify">Understand the review process →</Link></div></div><aside className="v2-state-steps"><span>Review path</span><ol><li><b>01</b><div><strong>Submitted</strong><p>Request and consent recorded.</p></div></li><li><b>02</b><div><strong>Verification</strong><p>Details and relevant supporting information reviewed.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>Outcome communicated without exposing private material.</p></div></li></ol></aside></div></section></div>;
}
