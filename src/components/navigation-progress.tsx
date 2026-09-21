"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPending(false);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (next.origin !== current.origin || (next.pathname === current.pathname && next.search === current.search)) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPending(true), 180);
    };

    const finishHistoryNavigation = () => {
      setPending(false);
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    document.addEventListener("click", begin, true);
    window.addEventListener("popstate", finishHistoryNavigation);
    return () => {
      document.removeEventListener("click", begin, true);
      window.removeEventListener("popstate", finishHistoryNavigation);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return pending ? <div className="amaana-nav-progress" aria-hidden="true"><span /></div> : null;
}
