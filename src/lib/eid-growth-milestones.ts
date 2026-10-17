export type EidGrowthRecord = Readonly<{ year: string; families: number }>;

export type EidGrowthMilestone = Readonly<{
  year: string;
  distributions: number;
  growthFromPrevious: number | null;
  cumulativeDistributions: number;
  barPercent: number;
}>;

/**
 * Interpret the existing approved figures as annual kit distributions.
 * Cumulative distributions are not a count of distinct beneficiary families.
 * No amount is estimated, extrapolated, or fetched from personal records.
 */
export function buildEidGrowthMilestones(records: readonly EidGrowthRecord[]): EidGrowthMilestone[] {
  if (records.length === 0) throw new RangeError("At least one documented distribution is required.");
  let previousYear = -Infinity;
  let previousCount: number | null = null;
  let cumulative = 0;
  const max = Math.max(...records.map(record => record.families));
  const milestones: EidGrowthMilestone[] = [];

  for (const record of records) {
    const year = Number(record.year);
    if (!/^\d{4}$/.test(record.year) || !Number.isInteger(year) || year <= previousYear) {
      throw new RangeError("Distribution years must be chronological and unique.");
    }
    if (!Number.isSafeInteger(record.families) || record.families < 0) {
      throw new RangeError("Annual distribution counts must be non-negative safe integers.");
    }
    cumulative += record.families;
    if (!Number.isSafeInteger(cumulative)) {
      throw new RangeError("Cumulative distribution count is outside the safe integer range.");
    }
    milestones.push({
      year: record.year,
      distributions: record.families,
      growthFromPrevious: previousCount === null ? null : record.families - previousCount,
      cumulativeDistributions: cumulative,
      barPercent: max === 0 ? 0 : (record.families / max) * 100,
    });
    previousCount = record.families;
    previousYear = year;
  }
  return milestones;
}
