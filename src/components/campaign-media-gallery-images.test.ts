import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignMediaGallery } from "./campaign-media-gallery";

afterEach(() => vi.unstubAllEnvs());
describe("actual gallery image delivery", () => {
  it("optimizes absolute same-origin public thumbnails with their existing lazy policy", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(createElement(CampaignMediaGallery, { items: [{ id: "synthetic", url: "https://amaanafoundation.org/media/2026/synthetic.webp", alt: "Synthetic fixture" }] }));
    expect(html).toContain('data-nimg="1"');
    expect(html).toContain('url=%2Fmedia%2F2026%2Fsynthetic.webp');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('rel="preload"');
  });
  it("retains direct external delivery and disposable data-image fixtures", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    for (const url of ["https://approved-cdn.example.org/media/synthetic.webp", "data:image/svg+xml,synthetic"]) {
      const html = renderToStaticMarkup(createElement(CampaignMediaGallery, { items: [{ id: "synthetic", url, alt: "Synthetic fixture" }] }));
      expect(html).toContain(`src="${url}"`);
      expect(html).not.toContain('data-nimg');
    }
  });
});
