import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type ImpactComparisonSearch = Record<string, string | string[] | undefined>;

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

  const first = publicRecords.find(record => record.slug === left);
  const second = publicRecords.find(record => record.slug === right);
  if (!first || !second) {
    return { options: publicRecords, requested: true, invalid: true, selected: null };
  }

  return { options: publicRecords, requested: true, invalid: false, selected: [first, second] };
}
