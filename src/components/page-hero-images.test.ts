import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageHero, PAGE_HERO_IMAGE_SIZES } from "./page-hero";
import { ProgrammeArtwork } from "./programme-artwork";
import { PublicMedia } from "./public-media";

const asset = { id: "synthetic-hero", kind: "IMAGE" as const, title: null,
  publicUrl: "/media/2026/synthetic-hero.webp", externalUrl: null,
  altText: "Synthetic hero fixture", caption: null, sourceYear: null, width: 1600, height: 1200 };

describe("PageHero responsive image delivery", () => {
  it.each(["photo", "artwork"] as const)("preloads %s with full-width mobile and right-column desktop sizing", kind => {
    const visual = kind === "photo"
      ? createElement(PublicMedia, { asset, priority: true, sizes: PAGE_HERO_IMAGE_SIZES })
      : createElement(ProgrammeArtwork, { slug: "seasonal-relief", priority: true, sizes: PAGE_HERO_IMAGE_SIZES });
    const html = renderToStaticMarkup(createElement(PageHero, { variant: "level2", eyebrow: "Synthetic", title: "Synthetic test", description: "Test only", visual }));
    expect(html).toContain('sizes="(max-width: 900px) 100vw, 50vw"');
    expect(html).toContain('imageSizes="(max-width: 900px) 100vw, 50vw"');
    expect(html).not.toContain('loading="lazy"');
  });
  it("does not turn body photography or artwork into preloaded hero resources", () => {
    const photo = renderToStaticMarkup(createElement(PublicMedia, { asset }));
    const artwork = renderToStaticMarkup(createElement(ProgrammeArtwork, { slug: "seasonal-relief" }));
    for (const html of [photo, artwork]) {
      expect(html).toContain('loading="lazy"');
      expect(html).not.toContain('rel="preload"');
      expect(html).not.toContain(PAGE_HERO_IMAGE_SIZES);
    }
  });
});

it("optimizes absolute Amaana public-media URLs rather than bypassing responsive delivery", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
  try {
    const html = renderToStaticMarkup(createElement(PublicMedia, { asset: { ...asset, publicUrl: "https://amaanafoundation.org/media/2026/synthetic-hero.webp" }, priority: true, sizes: PAGE_HERO_IMAGE_SIZES }));
    expect(html).toContain('data-nimg="1"');
    expect(html).toContain('url=%2Fmedia%2F2026%2Fsynthetic-hero.webp');
    expect(html).toContain('rel="preload"');
  } finally { vi.unstubAllEnvs(); }
});


it("keeps configured external CDN images direct rather than granting remote optimizer access", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
  vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://approved-cdn.example.org/media");
  try {
    const html = renderToStaticMarkup(createElement(PublicMedia, { asset: { ...asset, publicUrl: "https://approved-cdn.example.org/media/synthetic.webp" }, priority: true }));
    expect(html).toContain('src="https://approved-cdn.example.org/media/synthetic.webp"');
    expect(html).not.toContain('data-nimg');
    expect(html).toContain('fetchPriority="high"');
  } finally { vi.unstubAllEnvs(); }
});
