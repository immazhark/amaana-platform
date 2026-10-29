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
  it("uses a readable fallback when public document title and caption are blank", () => {
    const html = renderToStaticMarkup(PublicMedia({
      asset: {
        ...asset, kind: "DOCUMENT", publicUrl: "/media/reviewed-document.pdf",
        title: "   ", caption: "\t  ", altText: null,
      },
    }));
    expect(html).toContain("<h3>View approved source</h3>");
    expect(html).toContain('aria-label="Open approved source: approved source (new tab)"');
    expect(html).not.toContain("<h3>   </h3>");
  });

  it("uses the trimmed caption when the reviewed document title is blank", () => {
    const html = renderToStaticMarkup(PublicMedia({
      asset: {
        ...asset, kind: "DOCUMENT", publicUrl: "/media/reviewed-document.pdf",
        title: "  ", caption: " Reviewed document summary ", altText: null,
      },
    }));
    expect(html).toContain("<h3>Reviewed document summary</h3>");
    expect(html).toContain('aria-label="Open approved source: Reviewed document summary (new tab)"');
  });

  it("omits an empty figcaption for whitespace-only reviewed image captions", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: "  \\t ", sourceYear: null },
    }));
    expect(html).not.toContain("<figcaption>");
  });

  it("renders the year without a stray separator when the image caption is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: "   ", sourceYear: 2026 },
    }));
    expect(html).toContain("<figcaption>2026</figcaption>");
    expect(html).not.toContain(" · 2026");
  });

  it("trims a reviewed image caption before appending its year", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, caption: " Reviewed scene  ", sourceYear: 2026 },
    }));
    expect(html).toContain("<figcaption>Reviewed scene · 2026</figcaption>");
  });

});
