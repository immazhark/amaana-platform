import { describe, expect, it } from "vitest";
import { publishedProgrammeCategoryPaths } from "@/lib/sitemap-programme-categories";

describe("publishedProgrammeCategoryPaths", () => {
  it("includes a category only when a published top-level programme backs it", () => {
    const paths = publishedProgrammeCategoryPaths(new Set(["eid-gift-kits"]));

    expect(paths.has("/programmes/ramadan-eid")).toBe(true);
    expect(paths.has("/programmes/medical-financial-relief")).toBe(false);
    expect(paths.has("/programmes/emergency-relief")).toBe(false);
    expect(paths.has("/programmes/seasonal-relief")).toBe(false);
  });

  it("does not let a published child programme make its parent category discoverable", () => {
    const paths = publishedProgrammeCategoryPaths(new Set(["eid-gift-kits-2026"]));

    expect(paths.has("/programmes/ramadan-eid")).toBe(false);
  });

  it("does not emit non-programme category destinations such as the Taleem initiative route", () => {
    const paths = publishedProgrammeCategoryPaths(new Set(["taleem"]));

    expect(paths.has("/our-work/taleem")).toBe(false);
    expect([...paths].every(path => path.startsWith("/programmes/"))).toBe(true);
  });

  it("fails closed when no published initiative slugs are supplied", () => {
    expect(publishedProgrammeCategoryPaths(new Set())).toEqual(new Set());
  });
});
