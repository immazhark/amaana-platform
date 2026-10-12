"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { shouldRecordPublicPageView } from "@/lib/public-analytics";
import { sendBestEffortTelemetry } from "@/lib/client-telemetry";

type IdleWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function sendPageView(path: string) {
  sendBestEffortTelemetry("/api/analytics/page-view", { path }, {
    beacon: (endpoint, body) => navigator.sendBeacon(endpoint, body),
    post: fetch,
  });
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // An idle callback may run after a route transition, even if its
    // cancellation API is unavailable. Avoid stale writes in either case.
    let disposed = false;
    const isCurrentPublicVisit = () =>
      !disposed && shouldRecordPublicPageView(pathname, navigator.webdriver === true, window.location.pathname);
    if (!isCurrentPublicVisit()) return;
    const deliver = () => {
      if (isCurrentPublicVisit()) sendPageView(pathname);
    };

    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(deliver, { timeout: 1800 });
      return () => {
        disposed = true;
        idleWindow.cancelIdleCallback?.(handle);
      };
    }

    const handle = window.setTimeout(deliver, 500);
    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [pathname]);

  return null;
}
