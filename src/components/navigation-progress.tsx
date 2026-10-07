"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RouteLoading } from "./route-loading";

export function NavigationProgress() {
  const pathname = usePathname();
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const visible = pendingFrom === pathname;

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("af-navigation-lock");
    return () => document.body.classList.remove("af-navigation-lock");
  }, [visible]);

  useEffect(() => {
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href);
      if (next.origin !== location.origin || next.pathname === location.pathname) return;
      if (anchor.getClientRects().length === 0) return;

      setPendingFrom(location.pathname);
    };
    const reset = () => setPendingFrom(null);

    document.addEventListener("click", begin, true);
    window.addEventListener("popstate", reset);
    return () => {
      document.removeEventListener("click", begin, true);
      window.removeEventListener("popstate", reset);
    };
  }, []);

  return visible ? <RouteLoading /> : null;
}
