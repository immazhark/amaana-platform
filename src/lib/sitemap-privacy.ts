import type { ConfidentialityLevel } from "@prisma/client";

/**
 * Highly sensitive assistance-linked appeals may remain directly reachable for
 * accountability, but must not be promoted through search discovery surfaces.
 */
export function canListAppealInSitemap(level: ConfidentialityLevel | null | undefined) {
  return level !== "HIGHLY_SENSITIVE";
}
