import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { generatePublicImagePlaceholder } from "./public-image-placeholder";
import { getPublicImagePlaceholder } from "./public-media";
import { PublicMedia } from "@/components/public-media";
import { CampaignMediaGallery } from "@/components/campaign-media-gallery";

const pixels = 40_000_000;
const asset = { id: "synthetic", kind: "IMAGE" as const, title: null, publicUrl: "/media/2026/synthetic.png",
  externalUrl: null, altText: "Synthetic test image", caption: null, sourceYear: null, width: 240, height: 120 };

describe("bounded public-image ingestion previews", () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    it(`generates a metadata-free tiny JPEG from ${format}`, async () => {
      const original = await sharp({ create: { width: 240, height: 120, channels: 4, background: "#446FAA" } })
        .withMetadata({ exif: { IFD0: { Artist: "Synthetic test metadata" } } })[format]().toBuffer();
      expect((await sharp(original).metadata()).exif).toBeDefined();
      const preview = await generatePublicImagePlaceholder(original, pixels);
      expect(getPublicImagePlaceholder(preview)).toBe(preview);
      expect(preview).not.toBeNull();
      const encoded = Buffer.from(preview!.split(",")[1]!, "base64");
      expect(encoded.byteLength).toBeLessThanOrEqual(1024);
      const metadata = await sharp(encoded).metadata();
      expect(metadata.format).toBe("jpeg");
      expect(metadata.width).toBe(12);
      expect(metadata.height).toBe(6);
      expect(metadata.exif).toBeUndefined();
      expect(metadata.icc).toBeUndefined();
      expect(metadata.hasAlpha).toBe(false);
    });
  }
  it("rejects corrupt images and limits decoding work without blocking original ingestion", async () => {
    expect(await generatePublicImagePlaceholder(Buffer.from("invalid image"), pixels)).toBeNull();
    const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: "white" } }).png().toBuffer();
    expect(await generatePublicImagePlaceholder(image, 1)).toBeNull();
  });
  it("does not enlarge already-tiny images", async () => {
    const image = await sharp({ create: { width: 2, height: 1, channels: 3, background: "white" } }).png().toBuffer();
    const preview = await generatePublicImagePlaceholder(image, pixels);
    const decoded = await sharp(Buffer.from(preview!.split(",")[1]!, "base64")).metadata();
    expect([decoded.width, decoded.height]).toEqual([2, 1]);
  });
  it("does not accept arbitrary data URLs or oversized inline data for rendering", () => {
    for (const value of [null, {}, "javascript:alert(1)", "data:image/svg+xml,<svg/>", "https://photos.example.test/x.jpg", "data:image/jpeg;base64,/9j/" + "A".repeat(1400)]) {
      expect(getPublicImagePlaceholder(value)).toBeNull();
    }
  });
  it("uses ingestion previews in actual public-media and gallery rendering", async () => {
    const image = await sharp({ create: { width: 240, height: 120, channels: 3, background: "#446FAA" } }).png().toBuffer();
    const blurDataURL = await generatePublicImagePlaceholder(image, pixels);
    const media = renderToStaticMarkup(createElement(PublicMedia, { asset: { ...asset, blurDataURL } }));
    const gallery = renderToStaticMarkup(createElement(CampaignMediaGallery, { items: [{ id: asset.id, url: asset.publicUrl, alt: asset.altText, blurDataURL }] }));
    for (const html of [media, gallery]) {
      expect(html).toContain("background-image:url(");
      expect(html).toContain("data:image/svg+xml");
      expect(html).toContain('loading="lazy"');
      expect(html).not.toContain('rel="preload"');
    }
  });
  it("retains ordinary fallback for legacy metadata and invalid placeholders", () => {
    for (const blurDataURL of [undefined, null, "data:image/svg+xml,<svg/>"]) {
      const html = renderToStaticMarkup(createElement(PublicMedia, { asset: { ...asset, blurDataURL } }));
      expect(html).not.toContain("background-image:url(");
      expect(html).toContain('data-nimg="1"');
    }
  });
  it("does not render any preview when the public asset is unusable", () => {
    const html = renderToStaticMarkup(createElement(PublicMedia, { asset: { ...asset, publicUrl: null, blurDataURL: "data:image/jpeg;base64,/9j/AAAA" } }));
    expect(html).toBe("");
  });
});
