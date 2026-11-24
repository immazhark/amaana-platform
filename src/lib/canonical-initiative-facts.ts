import { TALEEM_INITIATIVE_SLUG, TALEEM_METRIC } from "@/content/taleem-facts";

/**
 * Overlays code-owned facts on initiative rows read from the database, at read time.
 *
 * The Taleem head-count lives in two places: the canonical source (src/content/taleem-facts.ts) and the metric columns
 * of the live `Initiative` row, which are only corrected when prisma/canonical-factual-locks.json is applied to that
 * database (a production data operation, run separately). Until then the pages that read the row would contradict the
 * pages that read the source. This overlay removes the contradiction without writing any data, and becomes a harmless
 * no-op once the row is synced.
 *
 * Only a row that is the Taleem initiative AND carries the metric columns is touched; everything else, including a row
 * from a query that did not select the metric, a null, or anything malformed, is returned unchanged and by reference.
 */
export function withCanonicalInitiativeFacts<T>(row: T): T {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return row;
  const record = row as Record<string, unknown>;
  if (record.slug !== TALEEM_INITIATIVE_SLUG) return row;
  if (!("primaryMetric" in record) || !("primaryMetricLabel" in record)) return row;
  return { ...record, primaryMetric: TALEEM_METRIC.value, primaryMetricLabel: TALEEM_METRIC.label } as T;
}

export function withCanonicalInitiativeFactsList<T>(rows: T): T {
  return (Array.isArray(rows) ? rows.map(withCanonicalInitiativeFacts) : rows) as T;
}
