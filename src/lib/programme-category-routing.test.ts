import { describe, expect, it } from "vitest";
import { programmeBySlug } from "./master-copy";
import {
  LEGACY_PROGRAMME_INITIATIVE_ROUTES,
  legacyProgrammeCategoryDestination,
  legacyProgrammeRoute,
  programmeCategoryFromRoute,
  programmeCategoryPath,
} from "./programme-category-routing";

describe("programme category canonical routing", () => {
  it("maps internal category slugs to one public canonical URL", () => {
    expect(programmeCategoryPath("medical-financial-relief")).toBe("/programmes/medical-financial-relief");
    expect(programmeCategoryPath("emergency-humanitarian-relief")).toBe("/programmes/emergency-relief");
    expect(programmeCategoryPath("ramadan-eid")).toBe("/programmes/ramadan-eid");
    expect(programmeCategoryPath("seasonal-relief")).toBe("/programmes/seasonal-relief");
    expect(programmeCategoryPath("amaana-taleem")).toBe("/our-work/taleem");
  });

  it("resolves only canonical category route slugs for rendering", () => {
    expect(programmeCategoryFromRoute("emergency-relief")).toBe("emergency-humanitarian-relief");
    expect(programmeCategoryFromRoute("seasonal-relief")).toBe("seasonal-relief");
    expect(programmeCategoryFromRoute("emergency-humanitarian-relief")).toBeNull();
    expect(programmeCategoryFromRoute("seasonal-essentials")).toBeNull();
  });

  it("redirects known legacy duplicate routes to canonical paths", () => {
    expect(legacyProgrammeCategoryDestination("emergency-humanitarian-relief")).toBe("/programmes/emergency-relief");
    expect(legacyProgrammeCategoryDestination("seasonal-essentials")).toBe("/programmes/seasonal-relief");
    expect(legacyProgrammeRoute("emergency-humanitarian-relief")).toEqual({
      kind: "category",
      destination: "/programmes/emergency-relief",
    });
  });

  it("keeps compatibility initiative routes deterministic and backed by canonical master content", () => {
    expect(LEGACY_PROGRAMME_INITIATIVE_ROUTES).toEqual({
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
    });

    for (const [routeSlug, route] of Object.entries(LEGACY_PROGRAMME_INITIATIVE_ROUTES)) {
      expect(programmeBySlug(route.targetSlug), `${routeSlug} must target canonical master content`).toBeDefined();
      expect(legacyProgrammeRoute(routeSlug)).toEqual({
        kind: "initiative",
        targetSlug: route.targetSlug,
        destination: route.destination,
      });
    }
  });

  it("returns null for unrelated programme route slugs", () => {
    expect(legacyProgrammeRoute("ramadan-eid")).toBeNull();
    expect(legacyProgrammeRoute("unknown-route")).toBeNull();
    expect(legacyProgrammeRoute("")).toBeNull();
    expect(legacyProgrammeRoute(undefined)).toBeNull();
  });
});
