/**
 * Ignore only recognised, bounded marketing attribution parameters on public
 * discovery GET pages. Values must not be reflected, persisted or used in
 * selection. Unknown fields (including possible personal data) stay invalid.
 */
const TRACKING_PARAMETERS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "utm_id", "gclid", "fbclid",
]);

export function hasUnsupportedPublicQueryFields(
  query: object,
  ownedFields: readonly string[],
): boolean {
  return Object.entries(query).some(([key, value]) =>
    !ownedFields.includes(key) &&
    (!TRACKING_PARAMETERS.has(key) || typeof value !== "string" || value.length > 256),
  );
}
