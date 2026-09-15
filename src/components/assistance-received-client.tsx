"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parsePrivateTrackingLocation, privateTrackingFragment, privateTrackingPath, type PrivateTrackingCredentials } from "@/lib/private-tracking";

export function AssistanceReceivedClient() {
  const [credentials, setCredentials] = useState<PrivateTrackingCredentials | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = parsePrivateTrackingLocation(window.location.search, window.location.hash);
    if (next && window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${privateTrackingFragment(next)}`);
    }
    setCredentials(next);
    setReady(true);
  }, []);

  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid"><div><p className="v2-section-label">Request received</p><h1>Your request is now in<br />a private review journey.</h1><p>Thank you for reaching out. Amaana will review what you shared and contact you if supporting details are needed.</p>{credentials && <div className="v2-reference-block"><span>Private reference</span><strong>{credentials.reference}</strong><small>Keep this reference and tracking link private.</small></div>}{ready && !credentials && <p className="muted">The private tracking details are not available in this browser address. Keep any reference or tracking link you were previously shown.</p>}<div className="v2-hero-actions">{credentials && <Link className="v2-button" href={privateTrackingPath("/request-assistance/status", credentials)}>Track this request</Link>}<Link className="v2-text-link" href="/">Return home →</Link></div></div><aside className="v2-state-steps"><span>What happens next</span><ol><li><b>01</b><div><strong>Review begins</strong><p>The team examines the information submitted.</p></div></li><li><b>02</b><div><strong>Follow-up if needed</strong><p>You may be contacted for clarification or supporting documents.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>The request progresses according to Amaana&apos;s verification process.</p></div></li></ol></aside></div></section></div>;
}
