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

  it("does not claim that faces are blurred from free-form alt or caption text", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[{
      id: "privacy-claim-unreviewed",
      url: "/media/approved.webp",
      alt: "Privacy protected beneficiary photograph",
      caption: "Blurred faces in approved programme documentation",
      width: 800,
      height: 600,
    }]} />);
    expect(html).toContain("Blurred faces in approved programme documentation");
    expect(html).not.toContain(">Privacy protected</span>");
  });

  it("keeps media selection stable when malformed input repeats an asset ID", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { id: "same-id", url: "/media/first.webp", alt: "First reviewed image" },
      { id: "same-id", url: "/media/second.webp", alt: "Different image with duplicate ID" },
    ]} />);
    expect(html).toContain("Enlarge image 1 of 1");
    expect(html).not.toContain("Enlarge image 2 of 2");
    expect(html).not.toContain("Different image with duplicate ID");
  });

  it("normalizes padded media URLs before selecting the image renderer", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { id: "padded", url: "  /media/approved.webp  ", alt: "Reviewed programme photo" },
      { id: "duplicate", url: "/media/approved.webp", alt: "Repeated URL" },
    ]} />);
    expect(html).toContain("/_next/image?url=%2Fmedia%2Fapproved.webp");
    expect(html).toContain("Enlarge image 1 of 1");
    expect(html).not.toContain("Repeated URL");
    expect(html).not.toContain('src="  /media/approved.webp  "');
  });

  it("keeps real graphic-design photographs uncropped while containing poster and carousel artwork", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={toPublicGalleryItems([
      { ...reviewedItem, id: "workshop", publicUrl: "/media/workshop.webp", altText: "Graphic design workshop photograph" },
      { ...reviewedItem, id: "photo", publicUrl: "/media/field.webp", altText: "Volunteers packing relief kits" },
      { ...reviewedItem, id: "poster", publicUrl: "/media/poster.webp", altText: "Thank you poster" },
      { ...reviewedItem, id: "slide", publicUrl: "/media/slide.webp", altText: "Carousel slide" },
    ])} />);

    const classes = Array.from(html.matchAll(/<figure class="([^"]+)"/g), match => match[1]);
    expect(classes).toHaveLength(4);
    expect(classes[0]).toBe(classes[1]);
    expect(classes[2]).not.toBe(classes[1]);
    expect(classes[3]).toBe(classes[2]);
  });

  it("uses the reviewed title when only the title identifies poster artwork", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={toPublicGalleryItems([
      { ...reviewedItem, id: "poster", publicUrl: "/media/title-poster.webp", title: "Thank you poster", altText: "Annual community update" },
      { ...reviewedItem, id: "photo", publicUrl: "/media/title-photo.webp", title: "Field photograph", altText: "Volunteers packing support kits" },
    ])} />);

    const classes = Array.from(html.matchAll(/<figure class="([^"]+)"/g), match => match[1]);
    expect(classes).toHaveLength(2);
    expect(classes[0]).not.toBe(classes[1]);
    expect(html).not.toContain("Thank you poster");
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
