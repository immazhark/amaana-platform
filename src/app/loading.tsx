"use client";

import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="amaana-loading-route-shell">
      <div className="amaana-loading-overlay" role="status" aria-live="polite" aria-label="Loading page">
        <div className="amaana-loading-indicator">
          <img className="amaana-loading-logo" src="/brand/amaana-mark.svg" alt="" aria-hidden="true" />
          <span className="amaana-loading-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="sr-only">Loading page</span>
        </div>
      </div>
    </div>
  );
}
