import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicMedia } from "./public-media";

const asset = {
  id: "approved-photo",
  kind: "IMAGE" as const,
  title: null,
  publicUrl: "https://amaanafoundation.org/media/approved.webp",
  externalUrl: null,
  altText: "Approved community outreach photo",
  caption: null,
  sourceYear: 2026,
  width: 1200,
  height: 800,
};

describe("public media image optimization", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses responsive Next image output for managed photos on the configured app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({ asset }));
    expect(html).toContain("/_next/image?url=%2Fmedia%2Fapproved.webp");
    expect(html).toContain("loading=\"lazy\"");
    expect(html).toContain('alt="Approved community outreach photo"');
  });

  it("omits empty figcaption when reviewed image caption is whitespace-only", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: "   ", sourceYear: null },
    }));
    expect(html).not.toContain("<figcaption>");
  });

  it("does not precede the year with an orphaned caption delimiter", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: " \t ", sourceYear: 2026 },
    }));
    expect(html).toContain("<figcaption>2026</figcaption>");
    expect(html).not.toContain(" · 2026");
  });

  it("trims the approved caption before rendering it with source year", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: " Reviewed scene  ", sourceYear: 2026 },
    }));
    expect(html).toContain("<figcaption>Reviewed scene · 2026</figcaption>");
  });

  it("keeps reviewed CDN media direct and lazy without authorizing remote optimization", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://cdn.amaana.example");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, publicUrl: "https://cdn.amaana.example/approved.webp" },
    }));
    expect(html).toContain('src="https://cdn.amaana.example/approved.webp"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("/_next/image?");
  });
});
