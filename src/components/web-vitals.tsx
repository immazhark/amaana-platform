"use client";

import { useReportWebVitals } from "next/web-vitals";
import { isTrackablePublicPath } from "@/lib/public-analytics";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];
type PublicVitalName = "LCP" | "INP" | "CLS";

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true";
const SAMPLE_RATE = 0.1;
const ENDPOINT = "/api/analytics/web-vitals";

let sampled: boolean | null = null;
let listenersInstalled = false;
let pageLoadPath: string | null = null;
const latest = new Map<string, { name: PublicVitalName; value: number }>();

function shouldSample() {
  if (sampled === null) sampled = Math.random() < SAMPLE_RATE;
  return sampled;
}

function sendReport(path: string, name: PublicVitalName, value: number) {
  const body = JSON.stringify({ path, name, value });
  if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) {
    return;
  }
  void fetch(ENDPOINT, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // Best-effort telemetry must never surface a UI error or break navigation.
  });
}

function flushLatest() {
  if (latest.size === 0 || !pageLoadPath || !isTrackablePublicPath(pageLoadPath)) return;
  for (const { name, value } of latest.values()) sendReport(pageLoadPath, name, value);
  latest.clear();
}

function handleWebVital(metric: Metric) {
  if (!ENABLED || !shouldSample()) return;
  if (metric.name !== "LCP" && metric.name !== "INP" && metric.name !== "CLS") return;
  if (!Number.isFinite(metric.value) || metric.value < 0) return;

  if (pageLoadPath === null) pageLoadPath = window.location.pathname;
  if (!isTrackablePublicPath(pageLoadPath)) return;

  // Next/Web Vitals may report multiple deltas for one id; keep the latest
  // score in memory and send one final sample when the page is backgrounded.
  latest.set(metric.id, { name: metric.name, value: metric.value });
  if (!listenersInstalled) {
    listenersInstalled = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushLatest();
    });
    window.addEventListener("pagehide", flushLatest);
  }
}

function WebVitalsReporter() {
  useReportWebVitals(handleWebVital);
  return null;
}

export function WebVitals() {
  // An explicit opt-in avoids added writes/observer work on staging and CI.
  if (!ENABLED) return null;
  return <WebVitalsReporter />;
}
