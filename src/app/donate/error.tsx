"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DonateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Donation route failed", { digest: error.digest ?? null });
  }, [error.digest]);

  return (
    <section className="v2-error-page" role="alert" aria-labelledby="donate-error-title">
      <div className="v2-error-orbit" aria-hidden="true"><span>!</span></div>
      <div className="v2-shell v2-error-content">
        <p className="v2-section-label">Secure donation journey</p>
        <h1 id="donate-error-title">The donation page could not load safely.</h1>
        <p>No payment has been initiated by this error screen. Try again before entering payment details. If you already completed a Razorpay payment, do not pay again; retain the payment confirmation and contact Amaana for reconciliation.</p>
        <div className="v2-error-actions">
          <button className="v2-button" type="button" onClick={reset}>Try again</button>
          <Link className="v2-text-link" href="/appeals">Return to appeals →</Link>
          <Link className="v2-text-link" href="/contact">Contact Amaana →</Link>
        </div>
      </div>
    </section>
  );
}
