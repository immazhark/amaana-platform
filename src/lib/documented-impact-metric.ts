/** A headline figure must retain its reviewed contextual unit.
 * Do not invent a fallback unit or display a blank metric as documented impact. */
export function documentedImpactMetric(
  value: string | null | undefined,
  label: string | null | undefined,
): { value: string; label: string } | null {
  if (typeof value !== "string" || !value.trim() ||
      typeof label !== "string" || !label.trim()) return null;
  return { value, label };
}
