import type { ConfidentialityLevel } from "@prisma/client";

/**
 * Highly sensitive assistance-linked appeals may remain directly reachable for
 * accountability, but must not be promoted through search discovery surfaces.
 */
export function canListAppealInSitemap(level: ConfidentialityLevel | null | undefined) {
  return level == null || level === "STANDARD" || level === "CONFIDENTIAL";
}

/**
 * Only canonical public route segments belong in indexed sitemap URLs.
 * Published database status does not make a historical/imported slug safe.
 * Keep this format aligned with the public appeal JSON-LD slug contract.
 */
export function isCanonicalSitemapSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length <= 200 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
