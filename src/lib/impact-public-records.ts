/** Retain only renderable public impact projection rows before any page dereference. */
export function retainRenderableImpactRecords<T extends {
  id: string;
  slug: string;
  title: string;
  cause: { title: string };
  mediaAssets: readonly unknown[];
}>(records: readonly T[]): T[] {
  if (!Array.isArray(records)) return [];

  return records.filter(record => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const value = record as unknown as Record<string, unknown>;
    const cause = value.cause;
    const causeTitle = cause && typeof cause === "object" && !Array.isArray(cause)
      ? (cause as { title?: unknown }).title : null;
    const metric = value.primaryMetric;
    const metricLabel = value.primaryMetricLabel;

    return typeof value.id === "string" && value.id.trim().length > 0
      && typeof value.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
      && typeof value.title === "string" && value.title.trim().length > 0
      && typeof causeTitle === "string" && causeTitle.trim().length > 0
      && Array.isArray(value.mediaAssets)
      && (metric == null || typeof metric === "string")
      && (metricLabel == null || typeof metricLabel === "string");
  });
}
