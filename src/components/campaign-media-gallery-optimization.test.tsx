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
  it("fails closed for unsafe directly supplied gallery URLs and missing descriptive alt text", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    // Client-side rendering has no server-only PUBLIC_MEDIA_BASE_URL variable.
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { id: "unsafe-js", url: "javascript:alert(1)", alt: "Unsafe scheme" },
      { id: "unsafe-network", url: "//untrusted.invalid/photo.jpg", alt: "Untrusted network origin" },
      { id: "unsafe-https-host", url: "https://untrusted.invalid/photo.webp", alt: "Untrusted HTTPS origin" },
      { id: "unsafe-admin", url: "/admin/donations", alt: "Private admin route" },
      { id: "unsafe-encoded", url: "/%61pi/admin/media", alt: "Encoded private route" },
      { id: "unsafe-site", url: "https://www.amaanafoundation.org/admin", alt: "Public host private route" },
      { id: "missing-alt", url: "/media/approved-without-alt.webp", alt: "  " },
      { id: "allowed-managed", url: " /media/approved-photo.webp ", alt: "Approved programme photograph" },
      { id: "allowed-cdn", url: "https://cdn.amaana.example/2026/documentary.webp", alt: "Approved CDN photograph", serverApprovedExternal: true },
    ]} />);
    expect(html).toContain("Enlarge image 1 of 2: Approved programme photograph");
    expect(html).toContain("Enlarge image 2 of 2: Approved CDN photograph");
    expect(html).toContain("/_next/image?url=%2Fmedia%2Fapproved-photo.webp");
    expect(html).toContain('src="https://cdn.amaana.example/2026/documentary.webp"');
    for (const rejected of [
      "Unsafe scheme", "Untrusted network origin", "Untrusted HTTPS origin", "Private admin route",
      "Encoded private route", "Public host private route", "approved-without-alt",
    ]) expect(html).not.toContain(rejected);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("optimizes approved first-party absolute images with responsive lazy thumbnails", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={toPublicGalleryItems([reviewedItem])} />);
    expect(html).toContain("/_next/image?url=%2Fmedia%2F2026%2Foutreach.webp");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Volunteers preparing community relief supplies"');
  });

  it("optimizes an approved directly supplied first-party absolute managed image", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { id: "direct-managed", url: "https://amaanafoundation.org/media/2026/approved.webp",
        alt: "Reviewed distribution supplies", width: 1200, height: 800 },
    ]} />);
    expect(html).toContain("/_next/image?url=%2Fmedia%2F2026%2Fapproved.webp");
    expect(html).not.toContain('src="https://amaanafoundation.org/media/2026/approved.webp"');
    expect(html).toContain('alt="Reviewed distribution supplies"');
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

  it("fails closed for malformed runtime gallery collections rather than crashing public pages", () => {
    for (const malformed of [
      null,
      undefined,
      "not-a-collection",
      { 0: { id: "forged", url: "/media/forged.webp", alt: "Forged media" }, length: 1 },
    ]) {
      const html = renderToStaticMarkup(
        <CampaignMediaGallery items={malformed as unknown as Parameters<typeof CampaignMediaGallery>[0]["items"]} />
      );
      expect(html, String(malformed)).toBe("");
    }

    const valid = renderToStaticMarkup(<CampaignMediaGallery items={[{
      id: "reviewed", url: "/media/reviewed.webp", alt: "Reviewed gallery photo",
    }]} />);
    expect(valid).toContain("Enlarge image 1 of 1: Reviewed gallery photo");
  });

  it("fails closed for malformed JS gallery items without dropping reviewed entries", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { id: "number-url", url: 42 as unknown as string, alt: "Numeric bad URL" },
      { id: "invalid-alt", url: "/media/invalid-alt.webp", alt: 27 as unknown as string },
      { id: "", url: "/media/empty-id.webp", alt: "Unstable empty identifier" },
      { id: "missing-object", url: "/media/blank.webp", alt: { trim: () => "forged" } as unknown as string },
      { id: "reviewed", url: "/media/reviewed.webp", alt: "Reviewed programme supplies" },
    ]} />);
    expect(html).toContain("Enlarge image 1 of 1: Reviewed programme supplies");
    expect(html).toContain('alt="Reviewed programme supplies"');
    for (const unsafe of ["Numeric bad URL", "invalid-alt.webp", "Unstable empty identifier", "blank.webp"]) {
      expect(html).not.toContain(unsafe);
    }
  });

});
