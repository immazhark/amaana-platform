"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isTrackablePublicPath } from "@/lib/public-analytics";

type IdleWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function sendPageView(path: string) {
  const body = JSON.stringify({ path });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/page-view", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/page-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isTrackablePublicPath(pathname)) return;

    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(() => sendPageView(pathname), { timeout: 1800 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(() => sendPageView(pathname), 500);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  return null;
}
