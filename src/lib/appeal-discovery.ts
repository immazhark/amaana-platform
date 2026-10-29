import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";

export const APPEAL_PAGE_SIZE = 12;

export type AppealSearch = Record<string, string | string[] | undefined>;

export function selectAppealDiscovery<T extends { title: string; summary: string }>(records: readonly T[], search: AppealSearch) {
  const raw = typeof search.q === "string" ? search.q : "";
  const q = raw.length > 80 ? "" : raw.trim().replace(/\s+/g, " ");
  const invalid = hasUnsupportedPublicQueryFields(search, ["q", "page"])
    || Array.isArray(search.page)
    || Boolean(search.page && (typeof search.page !== "string" || !/^[1-9]\d*$/.test(search.page) || !Number.isSafeInteger(Number(search.page))))
    || Array.isArray(search.q) || raw.length > 80 || q.length > 80 || /[\u0000-\u001f\u007f]/.test(raw);
  const normalizedQuery = invalid || !q ? "" : q.toLocaleLowerCase("en");
  const matching = invalid ? [] : records.filter(record => !q
    || `${record.title} ${record.summary}`.replace(/\s+/g, " ").toLocaleLowerCase("en").includes(normalizedQuery));
  const totalPages = Math.max(1, Math.ceil(matching.length / APPEAL_PAGE_SIZE));
  const page = invalid ? 1 : Math.min(Number(search.page || 1), totalPages);
  return { q: invalid ? "" : q, invalid, active: Boolean(q || search.page || invalid), page, totalPages,
    results: matching.slice((page - 1) * APPEAL_PAGE_SIZE, page * APPEAL_PAGE_SIZE), count: matching.length };
}
