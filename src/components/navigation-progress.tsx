"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RouteLoadingSkeleton } from "./route-loading-skeleton";
import { getNavigationLoadingView } from "@/lib/navigation-route-loading";

type PendingNavigation = { fromPath: string; destination: string };

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const visible = pending?.fromPath === pathname;
  const loadingView = visible && pending ? getNavigationLoadingView(pending.destination) : null;

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("af-navigation-lock");
    return () => document.body.classList.remove("af-navigation-lock");
  }, [visible]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target && anchor.target !== "_self" ||
          anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return;
      if (anchor.getClientRects().length === 0) return;
      let next: URL;
      try {
        next = new URL(anchor.href);
      } catch {
        return;
      }
      if (next.origin !== location.origin) return;
      // Hash-only links and the same URL are not route transitions.
      if (next.pathname === location.pathname && next.search === location.search) return;
      const expectedFrom = location.pathname;
      const destination = next.pathname;
      setPending({ fromPath: expectedFrom, destination });

      // The site can prevent navigation in a later bubble listener (such as
      // a protected donation action). A canceled click must not lock the UI.
      window.requestAnimationFrame(() => {
        if (event.defaultPrevented) {
          setPending(current => current?.fromPath === expectedFrom &&
            current.destination === destination ? null : current);
        }
      });
    };
    const reset = () => setPending(null);
    document.addEventListener("click", begin, true);
    window.addEventListener("popstate", reset);
    return () => {
      document.removeEventListener("click", begin, true);
      window.removeEventListener("popstate", reset);
    };
  }, []);

  if (!visible) return null;

  return <div className="amaana-loading-overlay amaana-navigation-loading"
    role={loadingView ? undefined : "status"}
    aria-live={loadingView ? undefined : "polite"}
    aria-label={loadingView ? undefined : "Loading page"}
  >
    {loadingView
      ? <RouteLoadingSkeleton label={loadingView.label} layout={loadingView.layout} />
      : <div className="amaana-loading-indicator">
          <Image className="amaana-loading-logo" src="/brand/amaana-mark.svg" alt=""
            aria-hidden="true" width={96} height={96} priority />
          <span className="amaana-loading-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="sr-only">Loading page</span>
        </div>}
  </div>;
}
