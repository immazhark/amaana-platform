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
  const options = areas
    .map(area => ({
      slug: area.slug,
      title: area.title,
      count: initiatives.filter(item => causeFor(item) === area.slug).length,
    }))
    .filter(area => area.count > 0);

  const value = search.programme;
  const programme = typeof value === "string" ? value : "";
  const invalid = Object.keys(search).some(key => key !== "programme")
    || Array.isArray(value)
    || Boolean(programme && !options.some(area => area.slug === programme));

  const active = invalid || Boolean(programme);
  const results = invalid ? [] : programme
    ? initiatives.filter(item => causeFor(item) === programme)
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
