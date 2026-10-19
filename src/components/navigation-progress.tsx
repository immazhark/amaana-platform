"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PendingNavigation = { fromPath: string; destination: string };

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const visible = pending?.fromPath === pathname;

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
          anchor.hasAttribute("download") || anchor.hasAttribute("data-navigation-progress-ignore") ||
          anchor.getAttribute("aria-disabled") === "true") return;
      if (anchor.getClientRects().length === 0) return;
      // Anchor URL properties are browser-normalized, avoiding duplicate URL
      // parsing on every navigation and rejecting external/unsafe schemes.
      if (anchor.origin !== location.origin) return;
      // Query-only navigation must never lock the page: usePathname does not change.
      if (anchor.pathname === location.pathname) return;
      const expectedFrom = location.pathname;
      const destination = anchor.pathname;
      setPending({ fromPath: expectedFrom, destination });

      // Next Link calls preventDefault in its own bubble handler to perform
      // an actual client transition. Checking defaultPrevented next frame
      // falsely cancels every genuine route loading state. For a bespoke
      // link that intentionally cancels navigation, opt out explicitly with
      // data-navigation-progress-ignore on the anchor.
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
    role="status" aria-live="polite" aria-label="Loading page"
  >
    <div className="amaana-loading-indicator">
      <Image className="amaana-loading-logo" src="/brand/amaana-mark.svg" alt=""
        aria-hidden="true" width={96} height={96} priority />
      <span className="amaana-loading-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="sr-only">Loading page</span>
    </div>
  </div>;
}
