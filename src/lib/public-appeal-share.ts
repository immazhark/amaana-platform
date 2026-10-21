/**
 * Share metadata must not disclose identifying copy from highly sensitive appeals.
 * The public detail page remains available; this copy is only for outward sharing.
 */
export function publicAppealShareCopy(title: string, summary: string, highlySensitive: boolean) {
  if (highlySensitive) {
    return {
      title: "Verified Support Appeal",
      summary: "A privacy-sensitive verified support appeal from Amaana Foundation. Public details are intentionally limited.",
    };
  }
  return { title, summary };
}
