import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";

export type AppealSearch = Record<string, string | string[] | undefined>;

export function selectAppealDiscovery<T extends { title: string; summary: string }>(records: readonly T[], search: AppealSearch) {
  const raw = typeof search.q === "string" ? search.q : "";
  const q = raw.length > 80 ? "" : raw.trim().replace(/\s+/g, " ");
  const invalid = hasUnsupportedPublicQueryFields(search, ["q"])
    || Array.isArray(search.q) || raw.length > 80 || q.length > 80 || /[\u0000-\u001f\u007f]/.test(raw);
  const normalizedQuery = invalid || !q ? "" : q.toLocaleLowerCase("en");
  const results = invalid ? [] : records.filter(record => !q
    || `${record.title} ${record.summary}`.replace(/\s+/g, " ").toLocaleLowerCase("en").includes(normalizedQuery));
  return { q: invalid ? "" : q, invalid, active: Boolean(q || invalid), results, count: results.length };
}
