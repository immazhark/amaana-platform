"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = pendingFrom === pathname;

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [visible]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (next.origin !== current.origin || next.pathname === current.pathname) return;

      setPendingFrom(current.pathname);
    };

    const finishHistoryNavigation = () => {
      setPendingFrom(null);
    };

    document.addEventListener("click", begin, true);
    window.addEventListener("popstate", finishHistoryNavigation);
    return () => {
      document.removeEventListener("click", begin, true);
      window.removeEventListener("popstate", finishHistoryNavigation);
    };
  }, []);

  return visible ? (
    <div className="amaana-loading-overlay amaana-navigation-loading" role="status" aria-live="polite" aria-label="Loading page">
      <div className="amaana-loading-indicator">
        <Image className="amaana-loading-logo" src="/brand/amaana-mark.svg" alt="" aria-hidden="true" width={96} height={96} priority />
        <span className="amaana-loading-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  ) : null;
}
