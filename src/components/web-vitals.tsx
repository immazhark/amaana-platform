"use client";

import { useReportWebVitals } from "next/web-vitals";
import { canRecordWebVitalOnCurrentRoute, normalizePublicWebVitalPath } from "@/lib/web-vitals-path";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];
type PublicVitalName = "LCP" | "INP" | "CLS";

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true";
const SAMPLE_RATE = 0.1;
const ENDPOINT = "/api/analytics/web-vitals";

let sampled: boolean | null = null;
let listenersInstalled = false;
// Bind performance measurements to the initial document route, not a later
// SPA navigation that might enter or leave an assistance/private page.
const pageLoadPath: string | null = typeof window === "undefined"
  ? null
  : normalizePublicWebVitalPath(window.location.pathname);
const latest = new Map<string, { name: PublicVitalName; value: number }>();
const reportedMetricIds = new Set<string>();

function shouldSample() {
  if (sampled === null) sampled = Math.random() < SAMPLE_RATE;
  return sampled;
}

function sendReport(path: string, name: PublicVitalName, value: number) {
  const body = JSON.stringify({ path, name, value });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Blocked Beacon transport is nonfatal; use the bounded fetch fallback.
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
  if (latest.size === 0) return;
  if (!canRecordWebVitalOnCurrentRoute(pageLoadPath, window.location.pathname)) {
    latest.clear();
    return;
  }
  if (!pageLoadPath) return;
  for (const [id, { name, value }] of latest) {
    // Visibility can alternate repeatedly in a session. Each metric ID
    // contributes at most one bucket; never double-count a resumed tab.
    if (reportedMetricIds.has(id)) continue;
    reportedMetricIds.add(id);
    sendReport(pageLoadPath, name, value);
  }
  latest.clear();
}

function handleWebVital(metric: Metric) {
  if (!ENABLED || !shouldSample()) return;
  if (metric.name !== "LCP" && metric.name !== "INP" && metric.name !== "CLS") return;
  if (!Number.isFinite(metric.value) || metric.value < 0) return;

  if (!canRecordWebVitalOnCurrentRoute(pageLoadPath, window.location.pathname)) return;

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
