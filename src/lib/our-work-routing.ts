export type LegacyOurWorkRoute =
  | {
      kind: "initiative";
      targetSlug: string;
      destination: `/our-work/${string}`;
    }
  | {
      kind: "category";
      categorySlug: string;
      destination: `/programmes/${string}`;
    };

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LEGACY_OUR_WORK_ROUTES: Readonly<Record<string, LegacyOurWorkRoute>> = {
  "medical-financial-assistance": {
    kind: "category",
    categorySlug: "medical-financial-relief",
    destination: "/programmes/medical-financial-relief",
  },
  "winter-drive-2025-26": {
    kind: "initiative",
    targetSlug: "winter-relief",
    destination: "/our-work/winter-relief",
  },
  "winter-relief-2025-26": {
    kind: "initiative",
    targetSlug: "winter-relief",
    destination: "/our-work/winter-relief",
  },
  "meat-distribution-2025": {
    kind: "initiative",
    targetSlug: "qurbani-meat-distribution-2025",
    destination: "/our-work/qurbani-meat-distribution-2025",
  },
  "meat-distribution-2026": {
    kind: "initiative",
    targetSlug: "qurbani-meat-distribution-2026",
    destination: "/our-work/qurbani-meat-distribution-2026",
  },
  "financial-aid-auto-rickshaw-2025": {
    kind: "initiative",
    targetSlug: "auto-rickshaw-livelihood-support",
    destination: "/our-work/auto-rickshaw-livelihood-support",
  },
  "medical-aid-eight-day-old-baby": {
    kind: "initiative",
    targetSlug: "emergency-neonatal-medical-aid",
    destination: "/our-work/emergency-neonatal-medical-aid",
  },
  "medical-aid-stage-three-cancer-2025": {
    kind: "initiative",
    targetSlug: "oral-cancer-surgery-support",
    destination: "/our-work/oral-cancer-surgery-support",
  },
  "medical-aid-ailing-mother": {
    kind: "initiative",
    targetSlug: "severe-burn-treatment-support",
    destination: "/our-work/severe-burn-treatment-support",
  },
  "medical-aid-aliza-ards-2026": {
    kind: "initiative",
    targetSlug: "aliza-critical-care-support",
    destination: "/our-work/aliza-critical-care-support",
  },
};

export function legacyOurWorkRoute(slug: string | null | undefined): LegacyOurWorkRoute | null {
  const normalized = typeof slug === "string" ? slug.trim() : "";
  if (!PUBLIC_SLUG_PATTERN.test(normalized)) return null;
  return LEGACY_OUR_WORK_ROUTES[normalized] ?? null;
}

export function isLegacyOurWorkSlug(slug: string | null | undefined) {
  return legacyOurWorkRoute(slug) !== null;
}

export function canonicalOurWorkDestination(slug: string | null | undefined) {
  const normalized = typeof slug === "string" ? slug.trim() : "";
  if (!PUBLIC_SLUG_PATTERN.test(normalized)) return "/our-work";
  return legacyOurWorkRoute(normalized)?.destination ?? `/our-work/${normalized}`;
}
