import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type ImpactProgrammeSearch = Record<string, string | string[] | undefined>;

type ImpactArea = Readonly<{ slug: string; title: string }>;

/** Only the canonical published programme taxonomy can filter public evidence.
 * Never echo arbitrary browser query values or load additional private records. */
export function filterImpactByProgramme<T>(
  initiatives: readonly T[],
  search: ImpactProgrammeSearch,
  areas: readonly ImpactArea[],
  causeFor: (initiative: T) => string | undefined,
) {
  // Build each public initiative's programme classification once, then reuse
  // it for both filter options and results. Avoid an areas × initiatives scan.
  const causeSlugs = initiatives.map(item => causeFor(item));
  const counts = new Map<string, number>();
  for (const slug of causeSlugs) {
    if (slug !== undefined) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const options = areas
    .map(area => ({
      slug: area.slug,
      title: area.title,
      count: counts.get(area.slug) ?? 0,
    }))
    .filter(area => area.count > 0);

  const value = search.programme;
  const programme = typeof value === "string" ? value : "";
  const invalid = hasUnsupportedPublicQueryFields(search, ["programme"])
    || Array.isArray(value)
    || Boolean(programme && !options.some(area => area.slug === programme));

  const active = invalid || Boolean(programme);
  const results = invalid ? [] : programme
    ? initiatives.filter((_, index) => causeSlugs[index] === programme)
    : [...initiatives];

  return {
    programme: invalid ? "" : programme,
    options,
    active,
    invalid,
    results,
    count: results.length,
  };
}
