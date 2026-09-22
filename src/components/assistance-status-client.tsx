"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { parsePrivateTrackingLocation, privateTrackingFragment } from "@/lib/private-tracking";

type TrackingRecord = {
  found: true;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TrackingResponse = TrackingRecord | { found: false };

const subscribeLocation = () => () => undefined;
const serverLocation = () => "__server__";
const browserLocation = () => `${window.location.search}\n${window.location.hash}`;

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
  const locationSnapshot = useSyncExternalStore(subscribeLocation, browserLocation, serverLocation);
  const hydrated = locationSnapshot !== "__server__";
  const [search = "", hash = ""] = hydrated ? locationSnapshot.split("\n", 2) : ["", ""];
  const credentials = hydrated ? parsePrivateTrackingLocation(search, hash) : null;
  const [record, setRecord] = useState<TrackingRecord | null | undefined>(undefined);

  useEffect(() => {
    if (!credentials) return;
    if (search) {
      window.history.replaceState(null, "", `${window.location.pathname}${privateTrackingFragment(credentials)}`);
    }

    // Fragments keep the token out of HTTP requests/referrers, but they can
    // still remain in browser history or screenshots. Once credentials are
    // captured in component state for this request, remove them from the
    // address bar entirely.
    window.history.replaceState(null, "", window.location.pathname);

    const controller = new AbortController();
    void fetch("/api/assistance/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async response => response.ok ? await response.json() as TrackingResponse : { found: false } as TrackingResponse)
      .then(result => setRecord(result.found ? result : null))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setRecord(null);
      });

    return () => controller.abort();
  }, [credentials, search]);

  const loading = !hydrated || (Boolean(credentials) && record === undefined);
  const title = loading
    ? "Checking your private request…"
    : record
      ? statusLabels[record.status] ?? record.status
      : "Tracking link unavailable";

  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid"><div><p className="v2-section-label">Private request tracking</p><h1>{title}</h1>{loading ? <p>Confirming the private tracking details in this browser.</p> : record ? <><p>{statusCopy[record.status] ?? "Your request status has been updated."}</p><div className="v2-reference-block"><span>Reference</span><strong>{credentials?.reference}</strong><small>Submitted {new Date(record.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })} · Last updated {new Date(record.updatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</small></div></> : <p>This tracking link is incomplete, invalid or no longer available. For privacy, no request details are shown without a valid reference and token.</p>}<div className="v2-hero-actions">{record ? <Link className="v2-button" href="/contact">Contact Amaana</Link> : <Link className="v2-button" href="/request-assistance">Start a new request</Link>}<Link className="v2-text-link" href="/how-we-verify">Understand the review process →</Link></div></div><aside className="v2-state-steps"><span>Review path</span><ol><li><b>01</b><div><strong>Submitted</strong><p>Request and consent recorded.</p></div></li><li><b>02</b><div><strong>Verification</strong><p>Details and relevant supporting information reviewed.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>Outcome communicated without exposing private material.</p></div></li></ol></aside></div></section></div>;
}
