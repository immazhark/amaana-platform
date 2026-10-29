import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type FaithSearch = Record<string, string | string[] | undefined>;

export function selectFaithDiscovery<T extends { title: string; excerpt: string; type: string }>(records: readonly T[], search: FaithSearch) {
  const raw = typeof search.q === "string" ? search.q : "";
  const q = raw.length > 80 ? "" : raw.trim().replace(/\s+/g, " ");
  const format = typeof search.format === "string" ? search.format : "";
  const invalid = hasUnsupportedPublicQueryFields(search, ["q", "format"])
    || Array.isArray(search.q) || Array.isArray(search.format)
    || raw.length > 80 || q.length > 80 || /[\u0000-\u001f\u007f]/.test(raw)
    || Boolean(format && !["ARTICLE", "REMINDER", "VIDEO"].includes(format));
  const normalizedQuery = invalid || !q ? "" : q.toLocaleLowerCase("en");
  const results = invalid ? [] : records.filter(item => (!format || item.type === format)
    && (!q || `${item.title} ${item.excerpt}`.replace(/\s+/g, " ").toLocaleLowerCase("en").includes(normalizedQuery)));
  return { q: invalid ? "" : q, format: invalid ? "" : format, invalid, active: Boolean(q || format || invalid), results, count: results.length };
}
