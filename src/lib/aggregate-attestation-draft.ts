import "server-only";
import { createHash } from "node:crypto";

/**
 * Offline synthetic input only. These codes are NOT approved impact metrics.
 * A digest here is not a signature, factual verification or tamper-evident proof.
 */
const syntheticMetricCodes = new Set([
  "SYNTHETIC_ACTIVITY_COUNT",
  "SYNTHETIC_DISTRIBUTION_COUNT",
]);
const version = "SYNTHETIC_AGGREGATE_DRAFT_V1";

type SyntheticMetric = {
  code: "SYNTHETIC_ACTIVITY_COUNT" | "SYNTHETIC_DISTRIBUTION_COUNT";
  count: number;
};

function exactObject(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Reflect.ownKeys(value).length !== keys.length ||
      !keys.every(key => Object.hasOwn(value, key))) {
    throw new Error(`${label} has missing or unexpected fields`);
  }
}

function parseDay(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  if (parsed.toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${label}`);
  return value;
}

export function digestSyntheticAggregateDraft(raw: unknown): {
  status: "SYNTHETIC_UNVERIFIED_NOT_PUBLIC";
  algorithm: "SHA-256";
  schemaVersion: typeof version;
  canonicalJson: string;
  digestHex: string;
} {
  exactObject(raw, ["schemaVersion", "periodStart", "periodEnd", "metrics"], "Aggregate draft");
  if (raw.schemaVersion !== version) throw new Error("Unsupported unverified aggregate draft version");
  const periodStart = parseDay(raw.periodStart, "period start");
  const periodEnd = parseDay(raw.periodEnd, "period end");
  if (periodStart > periodEnd) throw new Error("Aggregate period is reversed");
  const rawMetrics = raw.metrics;
  if (!Array.isArray(rawMetrics) || rawMetrics.length === 0 || rawMetrics.length > syntheticMetricCodes.size) {
    throw new Error("Invalid synthetic metric list");
  }
  if (Reflect.ownKeys(rawMetrics).length !== rawMetrics.length + 1 ||
      Array.from({ length: rawMetrics.length }, (_, index) => index)
        .some(index => !Object.hasOwn(rawMetrics, index))) {
    throw new Error("Sparse or unexpected synthetic metric array properties");
  }

  const seen = new Set<string>();
  const metrics: SyntheticMetric[] = rawMetrics.map((item: unknown) => {
    exactObject(item, ["code", "count"], "Aggregate metric");
    if (typeof item.code !== "string" || !syntheticMetricCodes.has(item.code)) {
      throw new Error("Unknown or unapproved synthetic metric code");
    }
    if (seen.has(item.code)) throw new Error("Duplicate aggregate metric code");
    seen.add(item.code);
    if (typeof item.count !== "number" || !Number.isSafeInteger(item.count) || item.count < 0 || Object.is(item.count, -0)) {
      throw new Error("Unsafe aggregate count");
    }
    return { code: item.code as SyntheticMetric["code"], count: item.count };
  });
  metrics.sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : 0);

  const canonicalJson = JSON.stringify({ schemaVersion: version, periodStart, periodEnd, metrics });
  const digestHex = createHash("sha256")
    .update("AMAANA:PRIVATE_SYNTHETIC_AGGREGATE_DRAFT_V1\0", "utf8")
    .update(canonicalJson, "utf8")
    .digest("hex");
  return {
    status: "SYNTHETIC_UNVERIFIED_NOT_PUBLIC",
    algorithm: "SHA-256",
    schemaVersion: version,
    canonicalJson,
    digestHex,
  };
}
