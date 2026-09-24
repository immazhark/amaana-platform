export const PROGRAMME_CATEGORY_PATHS = {
  "medical-financial-relief": "/programmes/medical-financial-relief",
  "emergency-humanitarian-relief": "/programmes/emergency-relief",
  "ramadan-eid": "/programmes/ramadan-eid",
  "amaana-taleem": "/our-work/taleem",
  "seasonal-relief": "/programmes/seasonal-relief",
} as const;

export type ProgrammeCategorySlug = keyof typeof PROGRAMME_CATEGORY_PATHS;

const PROGRAMME_ROUTE_TO_CATEGORY: Record<string, ProgrammeCategorySlug> = {
  "medical-financial-relief": "medical-financial-relief",
  "emergency-relief": "emergency-humanitarian-relief",
  "ramadan-eid": "ramadan-eid",
  "seasonal-relief": "seasonal-relief",
};

const LEGACY_PROGRAMME_CATEGORY_ROUTES: Readonly<Record<string, `/programmes/${string}`>> = {
  "emergency-humanitarian-relief": "/programmes/emergency-relief",
  "seasonal-essentials": "/programmes/seasonal-relief",
};

export const LEGACY_PROGRAMME_INITIATIVE_ROUTES: Readonly<Record<string, {
  targetSlug: string;
  destination: `/our-work/${string}`;
}>> = {
  qurbani: {
    targetSlug: "qurbani-meat-distribution",
    destination: "/our-work/qurbani-meat-distribution",
  },
  taleem: {
    targetSlug: "taleem",
    destination: "/our-work/taleem",
  },
  "eid-gift-kits": {
    targetSlug: "eid-gift-kits",
    destination: "/our-work/eid-gift-kits",
  },
  "dates-distribution": {
    targetSlug: "dates-distribution",
    destination: "/our-work/dates-distribution",
  },
};

export function programmeCategoryPath(categorySlug: string) {
  return PROGRAMME_CATEGORY_PATHS[categorySlug as ProgrammeCategorySlug] ?? "/our-work";
}

export function programmeCategoryFromRoute(routeSlug: string) {
  return PROGRAMME_ROUTE_TO_CATEGORY[routeSlug] ?? null;
}

export function legacyProgrammeCategoryDestination(routeSlug: string) {
  return LEGACY_PROGRAMME_CATEGORY_ROUTES[routeSlug] ?? null;
}

export type LegacyProgrammeRoute =
  | {
      kind: "category";
      destination: `/programmes/${string}`;
    }
  | {
      kind: "initiative";
      targetSlug: string;
      destination: `/our-work/${string}`;
    };

export function legacyProgrammeRoute(routeSlug: string | null | undefined): LegacyProgrammeRoute | null {
  const normalized = typeof routeSlug === "string" ? routeSlug.trim() : "";
  if (!normalized) return null;

  const categoryDestination = legacyProgrammeCategoryDestination(normalized);
  if (categoryDestination) {
    return {
      kind: "category",
      destination: categoryDestination as `/programmes/${string}`,
    };
  }

  const initiative = LEGACY_PROGRAMME_INITIATIVE_ROUTES[normalized];
  if (!initiative) return null;

  return {
    kind: "initiative",
    targetSlug: initiative.targetSlug,
    destination: initiative.destination,
  };
}
