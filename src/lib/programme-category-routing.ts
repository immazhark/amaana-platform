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

const LEGACY_PROGRAMME_CATEGORY_ROUTES: Record<string, string> = {
  "emergency-humanitarian-relief": "/programmes/emergency-relief",
  "seasonal-essentials": "/programmes/seasonal-relief",
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
