import { describe, expect, it } from "vitest";
import {
  legacyProgrammeCategoryDestination,
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
  });
});
