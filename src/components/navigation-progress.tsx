"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAVIGATION_STATUS_EVENT } from "./navigation-link";

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState<{ from: string; id: string } | null>(null);
  const visible = pending?.from === pathname;

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("af-navigation-lock");
    return () => document.body.classList.remove("af-navigation-lock");
  }, [visible]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return;

      const next = new URL(anchor.href);
      if (next.origin !== location.origin || next.pathname === location.pathname) return;
      if (anchor.getClientRects().length === 0) return;

      setPending({ from: location.pathname, id: "native" });
    };
    const status = (event: Event) => {
      const { id, from, pending: isPending } = (event as CustomEvent<{ id: string; from: string; pending: boolean }>).detail;
      setPending(current => isPending ? { id, from } : current?.id === id ? null : current);
    };
    const reset = () => setPending(null);

    document.addEventListener("click", begin);
    window.addEventListener("popstate", reset);
    window.addEventListener(NAVIGATION_STATUS_EVENT, status);
    return () => {
      document.removeEventListener("click", begin);
      window.removeEventListener("popstate", reset);
      window.removeEventListener(NAVIGATION_STATUS_EVENT, status);
    };
  }, []);

  return visible ? (
    <div className="amaana-loading-overlay amaana-navigation-loading" role="status" aria-live="polite" aria-label="Loading page">
      <div className="amaana-loading-indicator">
        <span className="amaana-loading-logo" aria-hidden="true" />
        <span className="amaana-loading-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  ) : null;
}
