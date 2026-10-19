import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignMediaGallery } from "./campaign-media-gallery";
import { toPublicGalleryItems } from "@/lib/public-gallery-projection";

const reviewedItem = {
  id: "approved-2026",
  kind: "IMAGE" as const,
  publicUrl: "https://amaanafoundation.org/media/2026/outreach.webp",
  altText: "Volunteers preparing community relief supplies",
  caption: "Approved programme documentation",
  width: 1200,
  height: 800,
};

describe("campaign gallery managed image optimization", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("optimizes approved first-party absolute images with responsive lazy thumbnails", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={toPublicGalleryItems([reviewedItem])} />);
    expect(html).toContain("/_next/image?url=%2Fmedia%2F2026%2Foutreach.webp");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Volunteers preparing community relief supplies"');
  });

  it("keeps approved external CDN photographs direct, without remote optimizer allowlisting", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://cdn.amaana.example");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={toPublicGalleryItems([
      { ...reviewedItem, publicUrl: "https://cdn.amaana.example/2026/outreach.webp" },
    ])} />);
    expect(html).toContain('src="https://cdn.amaana.example/2026/outreach.webp"');
    expect(html).not.toContain("/_next/image?");
  });
});
