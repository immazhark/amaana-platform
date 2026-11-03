import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHero } from "./page-hero";

const stylesheet = readFileSync(resolve(process.cwd(), "src/app/page-hero.css"), "utf8");

describe("AF-R062 PageHero fallback cascade", () => {
  it("maintains readable multiline PageHero title leading without changing the display family", () => {
    const rule = stylesheet.match(/\.page-hero__title\{([^}]*)\}/)?.[1];
    expect(rule).toBeDefined();
    const shorthand = rule?.match(/font:\s*500\s+var\(--title\)\s*\/\s*([\d.]+)\s+var\(--af-font-display\)/);
    expect(shorthand).not.toBeNull();
    const ratio = Number(shorthand?.[1]);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.35);
  });

  it("gives the Impact overview a scoped desktop padding budget without reducing title leading", () => {
    const desktop = stylesheet.match(/@media\(min-width:901px\)\{\.v2-impact-page>\.page-hero--level1\{([^}]*)\}\}/)?.[1];
    expect(desktop).toBeDefined();
    expect(desktop).toContain("--pad:clamp(2rem,2.5vw,2.5rem)");
    expect(desktop).not.toContain("!important");
    expect(desktop).not.toContain("line-height");
  });

  it("uses a more specific ordinary height rule for the direct-child fallback", () => {
    expect(stylesheet).toMatch(/\.page-hero__visual>:is\(figure,div,article\)\{height:100%\}/);
    const fallback = stylesheet.match(/\.page-hero__visual-fallback\{([^}]*)\}/)?.[1];
    expect(fallback).toBeDefined();
    expect(fallback).not.toMatch(/(?:^|;)height\s*:/);
    const rule = stylesheet.match(/\.page-hero__visual>\.page-hero__visual-fallback\{([^}]*)\}/)?.[1];
    expect(rule).toBeDefined();
    expect(rule).toMatch(/(?:^|;)height:auto(?:;|$)/);
    expect(rule).not.toMatch(/!important/);
  });

  it("renders fallback content as a direct visual child without changing rendered copy", () => {
    const html = renderToStaticMarkup(<PageHero
      variant="level2" eyebrow="Synthetic label" title="Synthetic page" description="Synthetic explanation"
      visualKicker="Synthetic visual" visualTitle="Synthetic title" visualNote="Synthetic note" />);
    expect(html).toMatch(/class="page-hero__visual"><div class="page-hero__visual-fallback" aria-hidden="true">/);
    expect(html).toContain("Synthetic page");
    expect(html).toContain("Synthetic visual");
    expect(html).toContain("Synthetic note");
  });
});
