import { describe, expect, it, vi, afterEach } from "vitest";
import { toPublicGalleryItems } from "./public-gallery-projection";

describe("programme and story gallery responsive media projection", () => {
  afterEach(() => vi.unstubAllEnvs());
  const photo = {
    id: "record-1", kind: "IMAGE" as const, publicUrl: "/media/2026/eid-kits.webp",
    externalUrl: null, altText: "Packing reviewed Eid kits", caption: "Volunteer packing",
    width: 1920, height: 1080, blurDataURL: "data:image/jpeg;base64,/9j/AA==",
  };

  it("preserves source dimensions, caption and reviewed low-quality preview", () => {
    expect(toPublicGalleryItems([photo])).toEqual([{
      id: "record-1", url: "/media/2026/eid-kits.webp", alt: photo.altText,
      caption: photo.caption, width: 1920, height: 1080, blurDataURL: photo.blurDataURL,
    }]);
  });

  it("excludes unapproved presentation kinds, missing alt and internal private paths", () => {
    const mixed = [
      photo,
      { ...photo, id: "undocumented", altText: " " },
      { ...photo, id: "private", publicUrl: "/api/admin/private" },
      { ...photo, id: "video", kind: "VIDEO" as const },
      { ...photo, id: "unsafe", publicUrl: "javascript:alert(1)" },
    ];
    expect(toPublicGalleryItems(mixed)).toHaveLength(1);
  });

  it("allows approved configured external media without switching to an unsafe optimizer", () => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.amaana.example");
    const [item] = toPublicGalleryItems([{ ...photo, publicUrl: "https://media.amaana.example/approved.jpg" }]);
    expect(item?.url).toBe("https://media.amaana.example/approved.jpg");
  });

  it("does not invent placeholders where legacy media is missing them", () => {
    const [item] = toPublicGalleryItems([{ ...photo, width: null, height: null, blurDataURL: null }]);
    expect(item?.width).toBeNull();
    expect(item?.height).toBeNull();
    expect(item?.blurDataURL).toBeNull();
  });
});
