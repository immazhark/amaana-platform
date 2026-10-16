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
    expect(html).toContain('(max-width: 360px) 100vw');
    expect(html).not.toContain('rel="preload"');
  });
  it("rejects external images when the server did not pass approved CDN origins", () => {
    const html = renderToStaticMarkup(createElement(CampaignMediaGallery, {
      items: [{ id: "unconfigured", url: "https://unapproved.example/photograph.webp", alt: "Not approved" }],
    }));
    expect(html).toBe("");
  });

  it("retains direct external delivery without proxying its origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    for (const url of ["https://approved-cdn.example.org/media/synthetic.webp"]) {
      const html = renderToStaticMarkup(createElement(CampaignMediaGallery, {
        items: [{ id: "synthetic", url, alt: "Synthetic fixture" }],
        approvedImageOrigins: ["https://approved-cdn.example.org"],
      }));
      expect(html).toContain(`src="${url}"`);
      expect(html).not.toContain('data-nimg');
    }
  });
});

it("rejects inline data-image gallery entries at the publication boundary", () => {
  const html = renderToStaticMarkup(createElement(CampaignMediaGallery, { items: [{ id: "inline", url: "data:image/svg+xml,synthetic", alt: "Synthetic fixture" }] }));
  expect(html).toBe("");
});
