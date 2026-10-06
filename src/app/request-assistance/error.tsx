"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AssistanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Assistance route failed", { digest: error.digest ?? null });
  }, [error.digest]);

  return (
    <section className="v2-error-page" role="alert" aria-labelledby="assistance-error-title">
      <div className="v2-error-orbit" aria-hidden="true"><span>!</span></div>
      <div className="v2-shell v2-error-content">
        <p className="v2-section-label">Private assistance request</p>
        <h1 id="assistance-error-title">Your request page could not complete safely.</h1>
        <p>Try loading the form again. Do not send medical records, identity documents, passwords, OTPs or banking credentials through ordinary email while reporting this technical problem.</p>
        <div className="v2-error-actions">
          <button className="v2-button" type="button" onClick={reset}>Try again</button>
          <Link className="v2-text-link" href="/request-assistance">Restart request →</Link>
          <Link className="v2-text-link" href="/contact">Contact Amaana →</Link>
        </div>
      </div>
    </section>
  );
}
