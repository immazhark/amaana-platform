import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pages = [
  "../app/stories/page.tsx",
  "../app/stories/[slug]/page.tsx",
  "../app/faith-and-reflections/page.tsx",
  "../app/faith-and-reflections/[slug]/page.tsx",
  "../app/our-work/page.tsx",
  "../app/impact/page.tsx",
  "../app/appeals/[slug]/page.tsx",
];

describe("actual PageHero identity images share responsive LCP sizing", () => {
  it.each(pages)("uses full-width mobile and half-width desktop on %s", relative => {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    expect(source).toContain("PAGE_HERO_IMAGE_SIZES");
    expect(source).toMatch(/<PublicMedia asset=\{[^}]+\} priority sizes=\{PAGE_HERO_IMAGE_SIZES\}/);
  });
});
