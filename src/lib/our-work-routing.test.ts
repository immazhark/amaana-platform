import { describe, expect, it } from "vitest";
import {
  LEGACY_OUR_WORK_ROUTES,
  canonicalOurWorkDestination,
  isLegacyOurWorkSlug,
  legacyOurWorkRoute,
} from "./our-work-routing";

const expectedRedirects = {
  "medical-financial-assistance": "/programmes/medical-financial-relief",
  "winter-drive-2025-26": "/our-work/winter-relief",
  "winter-relief-2025-26": "/our-work/winter-relief",
  "meat-distribution-2025": "/our-work/qurbani-meat-distribution",
  "meat-distribution-2026": "/our-work/qurbani-meat-distribution",
  "financial-aid-auto-rickshaw-2025": "/our-work/auto-rickshaw-livelihood-support",
  "medical-aid-eight-day-old-baby": "/our-work/emergency-neonatal-medical-aid",
  "medical-aid-stage-three-cancer-2025": "/our-work/oral-cancer-surgery-support",
  "medical-aid-ailing-mother": "/our-work/severe-burn-treatment-support",
  "medical-aid-aliza-ards-2026": "/our-work/aliza-critical-care-support",
} as const;

describe("Our Work canonical routing", () => {
  it("maps every proven legacy public slug to exactly one canonical destination", () => {
    expect(Object.keys(LEGACY_OUR_WORK_ROUTES).sort()).toEqual(Object.keys(expectedRedirects).sort());

    for (const [slug, destination] of Object.entries(expectedRedirects)) {
      expect(isLegacyOurWorkSlug(slug)).toBe(true);
      expect(legacyOurWorkRoute(slug)?.destination).toBe(destination);
      expect(canonicalOurWorkDestination(slug)).toBe(destination);
    }
  });

  it("keeps canonical slugs on the canonical Our Work route", () => {
    expect(canonicalOurWorkDestination("winter-relief")).toBe("/our-work/winter-relief");
    expect(canonicalOurWorkDestination("qurbani-meat-distribution"))
      .toBe("/our-work/qurbani-meat-distribution");
    expect(canonicalOurWorkDestination("emergency-neonatal-medical-aid"))
      .toBe("/our-work/emergency-neonatal-medical-aid");
    expect(isLegacyOurWorkSlug("winter-relief")).toBe(false);
  });

  it("fails closed to the Our Work index for malformed or empty slugs", () => {
    for (const slug of ["", "   ", "../admin", "/appeals", "two words", "bad_slug"]) {
      expect(canonicalOurWorkDestination(slug)).toBe("/our-work");
      expect(legacyOurWorkRoute(slug)).toBeNull();
    }
    expect(canonicalOurWorkDestination(null)).toBe("/our-work");
    expect(canonicalOurWorkDestination(undefined)).toBe("/our-work");
  });

  it("retains category-vs-initiative semantics for redirect metadata", () => {
    expect(legacyOurWorkRoute("medical-financial-assistance")).toEqual({
      kind: "category",
      categorySlug: "medical-financial-relief",
      destination: "/programmes/medical-financial-relief",
    });
    expect(legacyOurWorkRoute("medical-aid-aliza-ards-2026")).toEqual({
      kind: "initiative",
      targetSlug: "aliza-critical-care-support",
      destination: "/our-work/aliza-critical-care-support",
    });
  });
});
