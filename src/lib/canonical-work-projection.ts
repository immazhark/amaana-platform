/**
 * Align the public Our Work portfolio and outcome links with the same
 * canonical programme registry. The DB publication/privacy gates run before
 * this projection; this is an additional presentation boundary.
 */
type WorkInitiative = {
  slug: string;
  title: string;
  primaryMetric: string | null;
  primaryMetricLabel: string | null;
};

type ProgrammeIdentity = { causeSlug: string; parentSlug?: string | null };

export function projectCanonicalWork<T extends WorkInitiative>(
  initiatives: readonly T[],
  resolveProgramme: (slug: string) => ProgrammeIdentity | undefined,
) {
  const canonicalInitiatives: Array<T & { causeSlug: string; parentSlug: string | null }> = [];
  const publishedOutcomes: Array<{ slug: string; title: string; value: string; label: string }> = [];

  for (const initiative of initiatives) {
    const canonical = resolveProgramme(initiative.slug);
    if (!canonical) continue;
    canonicalInitiatives.push({
      ...initiative,
      causeSlug: canonical.causeSlug,
      parentSlug: canonical.parentSlug ?? null,
    });
    if (initiative.primaryMetric && initiative.primaryMetricLabel) {
      publishedOutcomes.push({
        slug: initiative.slug,
        title: initiative.title,
        value: initiative.primaryMetric,
        label: initiative.primaryMetricLabel,
      });
    }
  }
  return { canonicalInitiatives, publishedOutcomes };
}
