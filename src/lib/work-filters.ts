type DatedInitiative = { year: number | null; startYear: number | null; endYear: number | null };
type Programme = { slug: string; initiatives: DatedInitiative[] };
export type WorkSearch = { programme?: string | string[]; year?: string | string[] };

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
  const invalid = Array.isArray(search.programme) || Array.isArray(search.year)
    || Boolean(programme && !programmes.some(p => p.slug === programme))
    || Boolean(year && !years.some(value => String(value) === year));
  const active = Boolean(programme || year || invalid);
  const results = invalid ? [] : programmes
    .filter(p => !programme || p.slug === programme)
    .map(p => ({ ...p, initiatives: p.initiatives.filter(item => !year || yearsFor(item).includes(Number(year))) } as T))
    .filter(p => p.initiatives.length > 0);
  return { programme, year, years, invalid, active, results, count: results.reduce((total, p) => total + p.initiatives.length, 0) };
}
