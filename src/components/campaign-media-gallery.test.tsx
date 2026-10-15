import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CampaignMediaGallery } from "./campaign-media-gallery";

describe("actual public gallery rendering contract", () => {
  const photo = { id: "photo-1", url: "/media/2026/photo.webp",
    alt: "Volunteers preparing food kits", caption: "Approved packing photograph",
    width: 640, height: 480 };

  it("renders exactly one accessible trigger per safe approved image", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      photo,
      { ...photo, id: "same-url", url: " /media/2026/photo.webp " },
      { ...photo, id: "private", url: "/admin/private.jpg" },
      { ...photo, id: "unnamed", alt: null },
    ]}/>);
    expect((html.match(/aria-label="Enlarge image/g) ?? [])).toHaveLength(1);
    expect(html).toContain("Volunteers preparing food kits");
    expect(html).toContain("Approved packing photograph");
    expect(html).not.toContain("/admin/private.jpg");
  });

  it("does not render gallery thumbnails from external unconfigured hosts or private aliases", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { ...photo, id: "unknown-host", url: "https://unapproved.example/picture.webp" },
      { ...photo, id: "private-alias", url: "https://www.amaanafoundation.org/api/private.webp" },
    ]}/>);
    expect(html).toBe("");
  });

  it("does not render a modal or image for only unsafe entries", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { ...photo, id: "bad", url: "javascript:alert(1)" },
      { ...photo, id: "bad-alt", alt: "" },
    ]}/>);
    expect(html).toBe("");
  });

  it("does not create a distorted aspect ratio for incomplete image metadata", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { ...photo, width: 800, height: null },
    ]}/>);
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1200"');
  });

  it("does not trust impossible or negative image dimensions", () => {
    const html = renderToStaticMarkup(<CampaignMediaGallery items={[
      { ...photo, width: -200, height: Number.POSITIVE_INFINITY },
    ]}/>);
    expect(html).not.toContain('width="-200"');
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1200"');
  });
});
