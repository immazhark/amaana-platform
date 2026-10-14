/**
 * Public search and sharing context is intentionally stricter than content
 * shown on a directly visited appeal page. Never export a sensitive title or
 * case summary to structured metadata, breadcrumbs, or share sheets.
 */
export const SENSITIVE_APPEAL_TITLE = "Verified Support Appeal";
export const SENSITIVE_APPEAL_DESCRIPTION =
  "A privacy-sensitive verified support appeal from Amaana Foundation. Public details are intentionally limited.";

export function getAppealPublicCopy(
  title: string,
  summary: string,
  highlySensitive: boolean,
): { title: string; description: string } {
  return highlySensitive
    ? { title: SENSITIVE_APPEAL_TITLE, description: SENSITIVE_APPEAL_DESCRIPTION }
    : { title, description: summary };
}
