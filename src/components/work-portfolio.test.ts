import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkPortfolio } from "./work-portfolio";

type Causes = Parameters<typeof WorkPortfolio>[0]["causes"];
const asset = {
  id: "synthetic-thumbnail", kind: "IMAGE" as const, title: "Synthetic test image",
  publicUrl: "/media/2026/thumbnail-sizing-fixture.webp", externalUrl: null,
  altText: "Synthetic thumbnail sizing fixture", caption: null, sourceYear: 2026,
  width: 1600, height: 1200, blurDataURL: null, sortOrder: -1000,
};
const causes: Causes = [{
  id: "synthetic-category", slug: "synthetic-category", title: "Synthetic category", summary: "Test only",
  initiatives: [{
    id: "synthetic-initiative", slug: "synthetic-initiative", title: "Synthetic initiative", summary: "Test only",
    year: 2026, startYear: null, endYear: null, isFeatured: false,
    primaryMetric: null, primaryMetricLabel: null, mediaAssets: [asset],
  }],
}];

describe("Our Work thumbnail delivery", () => {
  it("uses rendered lazy-image width with explicit rem fallbacks", () => {
    const html = renderToStaticMarkup(createElement(WorkPortfolio, { causes, expanded: true }));
    expect(html).toContain('sizes="auto, (max-width: 600px) 4rem, (max-width: 1000px) 5.5rem, 6.5rem"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Synthetic thumbnail sizing fixture"');
    expect(html).toMatch(/srcSet="[^\"]+ 96w/);
    expect(html).not.toContain('sizes="(max-width: 700px) 100vw');
  });
  it("retains the approved placeholder when no identity photo exists", () => {
    const withoutMedia = causes.map(cause => ({ ...cause, initiatives: cause.initiatives.map(item => ({ ...item, mediaAssets: [] })) }));
    const html = renderToStaticMarkup(createElement(WorkPortfolio, { causes: withoutMedia }));
    expect(html).toContain("work-visual-placeholder");
    expect(html).not.toContain(asset.publicUrl);
  });
});
