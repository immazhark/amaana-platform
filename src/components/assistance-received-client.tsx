"use client";

import Link from "next/link";
import { useEffect } from "react";
import { privateTrackingFragment, privateTrackingPath } from "@/lib/private-tracking";

import { usePrivateTrackingCredentials } from "@/lib/use-private-tracking-credentials";

export function AssistanceReceivedClient() {
  const credentials = usePrivateTrackingCredentials();
  const hydrated = credentials !== undefined;

  useEffect(() => {
    if (!credentials || !window.location.search) return;
    window.history.replaceState(null, "", `${window.location.pathname}${privateTrackingFragment(credentials)}`);
  }, [credentials]);

  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid"><div><p className="v2-section-label">Request received</p><h1>{!hydrated ? "Checking your confirmation…" : credentials ? <>Your request is now in<br />a private review journey.</> : "Request confirmation unavailable"}</h1><p>{credentials ? "Thank you for reaching out. Amaana will review what you shared and contact you if supporting details are needed." : "A private confirmation link is needed to show your request reference. Opening this page alone does not submit a request."}</p>{credentials && <div className="v2-reference-block"><span>Private reference</span><strong>{credentials.reference}</strong><small>Keep this reference and tracking link private.</small></div>}{hydrated && !credentials && <p className="muted">The private tracking details are not available in this browser address. Keep any reference or tracking link you were previously shown.</p>}<div className="v2-hero-actions">{credentials && <Link className="v2-button" href={privateTrackingPath("/request-assistance/status", credentials)}>Track this request</Link>}<Link className="v2-text-link" href="/">Return home →</Link></div></div><aside className="v2-state-steps"><span>What happens next</span><ol><li><b>01</b><div><strong>Review begins</strong><p>The team examines the information submitted.</p></div></li><li><b>02</b><div><strong>Follow-up if needed</strong><p>You may be contacted for clarification or supporting documents.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>The request progresses according to Amaana&apos;s verification process.</p></div></li></ol></aside></div></section></div>;
}
