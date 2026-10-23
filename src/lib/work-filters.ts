import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
type DatedInitiative = { slug?: string; parentSlug?: string | null; year: number | null; startYear: number | null; endYear: number | null };
type Programme = { slug: string; initiatives: DatedInitiative[] };
export type WorkSearch = { programme?: string | string[]; year?: string | string[] } & Record<string, string | string[] | undefined>;

function yearsFor(item: DatedInitiative): number[] {
  if (item.year !== null) return [item.year];
  if (item.startYear === null) return item.endYear === null ? [] : [item.endYear];
  const end = item.endYear ?? item.startYear;
  // Malformed ranges must not create unbounded allocations or invented dates.
  if (end < item.startYear || end - item.startYear > 100) return [item.startYear];
  return Array.from({ length: end - item.startYear + 1 }, (_, index) => item.startYear! + index);
}

export function filterWork<T extends Programme>(programmes: T[], search: WorkSearch) {
  const programme = typeof search.programme === "string" ? search.programme : "";
  const year = typeof search.year === "string" ? search.year : "";
  const years = [...new Set(programmes.flatMap(p => p.initiatives.flatMap(yearsFor)))].sort((a, b) => b - a);
  const invalid = hasUnsupportedPublicQueryFields(search, ["programme", "year"])
    || Array.isArray(search.programme) || Array.isArray(search.year)
    || Boolean(programme && !programmes.some(p => p.slug === programme))
    || Boolean(year && !years.some(value => String(value) === year));
  const active = Boolean(programme || year || invalid);
  const results = invalid ? [] : programmes
    .filter(p => !programme || p.slug === programme)
    .map(p => {
      const publishedSlugs = new Set(p.initiatives.map(item => item.slug));
      const matching = p.initiatives.filter(item => year
        ? yearsFor(item).includes(Number(year))
        : !item.parentSlug || !publishedSlugs.has(item.parentSlug));
      // An annual edition replaces its umbrella only when that edition is
      // published and matches the selected year. Preserve standalone ranges.
      const representedParents = new Set(year ? matching.map(item => item.parentSlug).filter(Boolean) : []);
      return { ...p, initiatives: matching.filter(item => !item.slug || !representedParents.has(item.slug)) } as T;
    })
    .filter(p => p.initiatives.length > 0);
  // A rejected query must not be serialized back into public select values.
  return {
    programme: invalid ? "" : programme,
    year: invalid ? "" : year,
    years, invalid, active, results,
    count: results.reduce((total, p) => total + p.initiatives.length, 0),
  };
}
