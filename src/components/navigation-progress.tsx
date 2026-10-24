"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PendingNavigation = { fromPath: string };

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const [observedPath, setObservedPath] = useState(pathname);
  // An App Router transition has completed when its pathname changes.
  // Reset before the new route commits so a later programmatic return cannot
  // replay a stale loading overlay or leave scrolling locked.
  if (observedPath !== pathname) {
    setObservedPath(pathname);
    setPending(null);
  }
  const visible = observedPath === pathname && pending?.fromPath === pathname;

  useEffect(() => {
    if (!visible) return;

    // A cancelled or failed client transition can leave usePathname unchanged.
    // Never trap keyboard focus or body scrolling behind a stale overlay.
    const release = () => setPending(null);
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") release();
    };
    const recovery = window.setTimeout(release, 15_000);

    document.body.classList.add("af-navigation-lock");
    document.addEventListener("keydown", dismissOnEscape);
    window.addEventListener("pagehide", release);

    return () => {
      window.clearTimeout(recovery);
      document.removeEventListener("keydown", dismissOnEscape);
      window.removeEventListener("pagehide", release);
      document.body.classList.remove("af-navigation-lock");
    };
  }, [visible]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null;
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
      setPending({ fromPath: expectedFrom });

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
