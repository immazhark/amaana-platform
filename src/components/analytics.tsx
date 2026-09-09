"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const excluded = ["/admin", "/api", "/donate", "/donations", "/request-assistance"];
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || excluded.some(prefix => pathname.startsWith(prefix))) return;
    const body = JSON.stringify({ path: pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics/page-view", new Blob([body], { type: "application/json" }));
    else void fetch("/api/analytics/page-view", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  }, [pathname]);
  return null;
}
