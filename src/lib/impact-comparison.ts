import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type ImpactComparisonSearch = Record<string, string | string[] | undefined>;

export type ComparablePublicImpactRecord = {
  slug: string;
  title: string;
  summary: string;
  cause: { title: string };
  primaryMetric: string | null;
  primaryMetricLabel: string | null;
};

/** Validate the narrow published comparison projection before page dereferences. */
export function retainComparableImpactRecords<T extends ComparablePublicImpactRecord>(records: readonly T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.filter(record => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const value = record as unknown as Record<string, unknown>;
    const cause = value.cause;
    const causeTitle = cause && typeof cause === "object" && !Array.isArray(cause)
      ? (cause as { title?: unknown }).title : null;
    return typeof value.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
      && typeof value.title === "string" && value.title.trim().length > 0
      && typeof value.summary === "string"
      && typeof causeTitle === "string" && causeTitle.trim().length > 0
      && (value.primaryMetric == null || typeof value.primaryMetric === "string")
      && (value.primaryMetricLabel == null || typeof value.primaryMetricLabel === "string");
  });
}

/** Compare only entries from the already-approved public projection. Never
 * merge incomparable metrics or reflect untrusted query parameters. */
export function selectImpactComparison<T extends { slug: string }>(
  publicRecords: readonly T[],
  search: ImpactComparisonSearch,
): {
  options: readonly T[];
  requested: boolean;
  invalid: boolean;
  selected: readonly [T, T] | null;
} {
  const keys = Object.keys(search);
  const suppliedSelections = keys.filter(key => key === "left" || key === "right");
  const unsupported = hasUnsupportedPublicQueryFields(search, ["left", "right"]);
  if (suppliedSelections.length === 0 && !unsupported) {
    return { options: publicRecords, requested: false, invalid: false, selected: null };
  }

  const left = search.left;
  const right = search.right;
  const validShape = !unsupported && suppliedSelections.length === 2
    && typeof left === "string" && typeof right === "string"
    && Boolean(left) && Boolean(right) && left !== right;

  if (!validShape) return { options: publicRecords, requested: true, invalid: true, selected: null };

  let first: T | undefined;
  let second: T | undefined;
  let ambiguous = false;
  for (const record of publicRecords) {
    if (record.slug === left) {
      if (first) { ambiguous = true; break; }
      first = record;
    } else if (record.slug === right) {
      if (second) { ambiguous = true; break; }
      second = record;
    }
  }
  if (ambiguous || !first || !second) {
    return { options: publicRecords, requested: true, invalid: true, selected: null };
  }

  return { options: publicRecords, requested: true, invalid: false, selected: [first, second] };
}
