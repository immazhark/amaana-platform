import { describe, expect, it } from "vitest";
import { getPublicImageDimensions } from "./public-image-dimensions";
import { toPublicGalleryItems } from "./public-gallery-projection";

const approved = {
  id: "photo-1",
  kind: "IMAGE" as const,
  publicUrl: "/media/field-eid-kits.webp",
  altText: "Volunteers packing documented Eid kits",
  caption: "Packing kits for distribution",
  width: 1920,
  height: 1080,
};

describe("public image gallery projection", () => {
  it("retains approved image dimensions for accurate lightbox geometry", () => {
    const result = toPublicGalleryItems([approved]);
    expect(result).toEqual([{
      id: approved.id,
      url: approved.publicUrl,
      alt: approved.altText,
      caption: approved.caption,
      width: 1920,
      height: 1080,
    }]);
    expect(getPublicImageDimensions(result[0]!)).toEqual({ width: 1920, height: 1080 });
  });

  it("preserves a valid image when dimensions were not recorded", () => {
    const [result] = toPublicGalleryItems([{ ...approved, width: null, height: null }]);
    expect(result).toMatchObject({ width: null, height: null });
    expect(getPublicImageDimensions(result!)).toEqual({ width: 1600, height: 1200 });
  });

  it("does not project unapproved images, non-images, or URLs on unknown origins", () => {
    expect(toPublicGalleryItems([
      approved,
      { ...approved, id: "no-caption", altText: " " },
      { ...approved, id: "wrong-type", kind: "VIDEO" as const },
      { ...approved, id: "external", publicUrl: "https://unknown.example/photo.webp" },
    ])).toEqual([expect.objectContaining({ id: "photo-1" })]);
  });
});
