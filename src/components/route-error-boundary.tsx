"use client";

import Link from "next/link";

type RouteErrorBoundaryProps = {
  eyebrow: string;
  heading: string;
  message: string;
  reset: () => void;
};

export function RouteErrorBoundary({
  eyebrow,
  heading,
  message,
  reset,
}: RouteErrorBoundaryProps) {
  return (
    <section className="v2-error-page" role="alert">
      <div className="v2-error-orbit" aria-hidden="true">
        <span>!</span>
      </div>
      <div className="v2-shell v2-error-content">
        <p className="v2-section-label">{eyebrow}</p>
        <h1>{heading}</h1>
        <p>{message}</p>
        <div className="v2-error-actions">
          <button className="v2-button" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="v2-text-link" href="/">
            Return home →
          </Link>
          <Link className="v2-text-link" href="/contact">
            Contact Amaana →
          </Link>
        </div>
      </div>
    </section>
  );
}
