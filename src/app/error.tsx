"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route failed", error.digest ?? error.message); }, [error]);

  return (
    <section className="v2-error-page">
      <div className="v2-error-orbit" aria-hidden="true"><span>!</span></div>
      <div className="v2-shell v2-error-content">
        <p className="v2-section-label">A temporary interruption</p>
        <h1>This page could not<br />complete its <em>journey.</em></h1>
        <p>Try loading it again. If the problem continues, you can return to Amaana&apos;s public work or contact the team. Never send passwords, OTPs, UPI PINs or card credentials while reporting a technical issue.</p>
        <div className="v2-error-actions">
          <button className="v2-button" type="button" onClick={reset}>Try again</button>
          <Link className="v2-text-link" href="/">Return home →</Link>
          <Link className="v2-text-link" href="/contact">Contact Amaana →</Link>
        </div>
      </div>
    </section>
  );
}
