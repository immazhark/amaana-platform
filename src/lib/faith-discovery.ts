import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type FaithSearch = Record<string, string | string[] | undefined>;
export const FAITH_PAGE_SIZE = 12;

export function selectFaithDiscovery<T extends { title: string; excerpt: string; type: string }>(records: readonly T[], search: FaithSearch) {
  const raw = typeof search.q === "string" ? search.q : "";
  const q = raw.length > 80 ? "" : raw.trim().replace(/\s+/g, " ");
  const format = typeof search.format === "string" ? search.format : "";
  const invalid = hasUnsupportedPublicQueryFields(search, ["q", "format", "page"])
    || Array.isArray(search.q) || Array.isArray(search.format) || Array.isArray(search.page)
    || raw.length > 80 || q.length > 80 || /[\u0000-\u001f\u007f]/.test(raw)
    || Boolean(format && !["ARTICLE", "REMINDER", "VIDEO"].includes(format))
    || Boolean(search.page && (typeof search.page !== "string" || !/^[1-9]\d*$/.test(search.page) || !Number.isSafeInteger(Number(search.page))));
  const normalizedQuery = invalid || !q ? "" : q.toLocaleLowerCase("en");
  const matching = invalid ? [] : records.filter(item => (!format || item.type === format)
    && (!q || `${item.title} ${item.excerpt}`.replace(/\s+/g, " ").toLocaleLowerCase("en").includes(normalizedQuery)));
  const totalPages = Math.max(1, Math.ceil(matching.length / FAITH_PAGE_SIZE));
  const page = invalid ? 1 : Math.min(Number(search.page || 1), totalPages);
  return { q: invalid ? "" : q, format: invalid ? "" : format,
    invalid, active: Boolean(q || format || search.page || invalid), page, totalPages,
    results: matching.slice((page - 1) * FAITH_PAGE_SIZE, page * FAITH_PAGE_SIZE), count: matching.length };
}
