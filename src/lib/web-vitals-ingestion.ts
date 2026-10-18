import { z } from "zod";
import { readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { normalizePublicWebVitalPath } from "@/lib/web-vitals-path";

export const MAX_WEB_VITAL_JSON_BYTES = 512;
export const CORE_WEB_VITALS = ["LCP", "INP", "CLS"] as const;
export type CoreWebVital = typeof CORE_WEB_VITALS[number];
export type WebVitalBucket = "excellent" | "good" | "needsImprovement" | "poor";

/**
 * "Excellent" is Amaana's aspirational target; "good"/"poor" retain
 * the conventional Core Web Vitals thresholds for honest reporting.
 * Milliseconds for LCP and INP, unitless score for CLS.
 */
export const webVitalThresholds: Record<CoreWebVital, {
  excellent: number; good: number; poor: number; maximum: number;
}> = {
  LCP: { excellent: 1200, good: 2500, poor: 4000, maximum: 120_000 },
  INP: { excellent: 50, good: 200, poor: 500, maximum: 120_000 },
  CLS: { excellent: 0.05, good: 0.1, poor: 0.25, maximum: 10 },
};

const payloadSchema = z.object({
  path: z.string().max(200),
  name: z.enum(CORE_WEB_VITALS),
  value: z.number().finite().nonnegative(),
}).strict();

export function classifyWebVital(name: CoreWebVital, value: number): WebVitalBucket | null {
  const t = webVitalThresholds[name];
  if (!Number.isFinite(value) || value < 0 || value > t.maximum) return null;
  if (value <= t.excellent) return "excellent";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needsImprovement";
  return "poor";
}

export async function parseWebVitalPayload(request: Request) {
  const raw = JSON.parse(await readTextBodyWithLimit(request, MAX_WEB_VITAL_JSON_BYTES, { timeoutMs: 5_000 }));
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  const path = normalizePublicWebVitalPath(parsed.data.path);
  const bucket = classifyWebVital(parsed.data.name, parsed.data.value);
  if (!path || !bucket) return null;
  return { path, name: parsed.data.name, bucket };
}
