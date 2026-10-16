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
    // Native navigations and interrupted client transitions are not guaranteed
    // to emit a completion event. Never leave the whole document scroll-locked.
    const MAX_PENDING_MS = 12_000;
    let releaseTimer: ReturnType<typeof setTimeout> | null = null;
    let activeTransition: { id: string; from: string } | null = null;
    const clearReleaseTimer = () => {
      if (releaseTimer !== null) clearTimeout(releaseTimer);
      releaseTimer = null;
    };
    const startPending = (id: string, from: string) => {
      clearReleaseTimer();
      activeTransition = { id, from };
      setPending({ id, from });
      releaseTimer = setTimeout(() => {
        releaseTimer = null;
        if (activeTransition?.id !== id || activeTransition.from !== from) return;
        activeTransition = null;
        setPending(current => current?.id === id && current.from === from ? null : current);
      }, MAX_PENDING_MS);
    };
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || (anchor.target && anchor.target.toLowerCase() !== "_self") || anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return;

      let next: URL;
      try {
        next = new URL(anchor.href);
      } catch {
        return;
      }
      // Pathname drives overlay completion; query-only transitions cannot safely hold the global lock.
      if (next.origin !== location.origin || next.pathname === location.pathname) return;
      if (anchor.getClientRects().length === 0) return;
      startPending("native", location.pathname);
    };
    const status = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") return;
      const { id, from, pending: isPending } = detail as Record<string, unknown>;
      if (typeof id !== "string" || !id || typeof from !== "string" ||
          !from.startsWith("/") || typeof isPending !== "boolean") return;
      if (isPending) {
        // Events for pages the visitor has already left must never relock
        // the current document after a rapid route change.
        if (from !== location.pathname) return;
        startPending(id, from);
      } else if (activeTransition?.id === id && activeTransition.from === from) {
        activeTransition = null;
        clearReleaseTimer();
        setPending(current => current?.id === id && current.from === from ? null : current);
      }
    };
    const reset = () => {
      activeTransition = null;
      clearReleaseTimer();
      setPending(null);
    };

    document.addEventListener("click", begin);
    window.addEventListener("popstate", reset);
    window.addEventListener("pagehide", reset);
    window.addEventListener(NAVIGATION_STATUS_EVENT, status);
    return () => {
      activeTransition = null;
      clearReleaseTimer();
      document.removeEventListener("click", begin);
      window.removeEventListener("popstate", reset);
      window.removeEventListener("pagehide", reset);
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
