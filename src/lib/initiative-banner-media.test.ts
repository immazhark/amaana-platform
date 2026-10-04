import { describe, expect, it } from "vitest";
import { selectInitiativeBannerImage } from "./initiative-banner-media";

const photo = { kind: "IMAGE" as const, publicUrl: "/media/vehicle.webp", altText: "The funded auto-rickshaw", title: "Vehicle photograph", width: 1600, height: 1000 };
describe("initiative banner image selection", () => {
  it("prefers documentary landscape photos to identity graphics and portraits", () => {
    const poster = { ...photo, publicUrl: "/media/update.webp", title: "Results update", sortOrder: -1000 };
    const portrait = { ...photo, publicUrl: "/media/portrait.webp", width: 800, height: 1200 };
    expect(selectInitiativeBannerImage([poster, portrait, photo])).toBe(photo);
  });
  it("excludes collages, unsafe images, documents and uncaptained videos", () => {
    expect(selectInitiativeBannerImage([
      { ...photo, title: "Programme collage" },
      { ...photo, publicUrl: "/programme-artwork/eid.webp" },
      { ...photo, altText: "" },
      { ...photo, publicUrl: "http://unsafe.example/photo.jpg" },
      { ...photo, kind: "DOCUMENT" },
      { ...photo, kind: "VIDEO" },
    ])).toBeUndefined();
    expect(selectInitiativeBannerImage([])).toBeUndefined();
  });
  it("uses a single published graphic when no photograph exists and remains deterministic", () => {
    const graphic = { ...photo, title: "Campaign poster" };
    expect(selectInitiativeBannerImage([graphic])).toBe(graphic);
    expect(selectInitiativeBannerImage([photo, { ...photo, publicUrl: "/media/second.webp" }])).toBe(photo);
  });
});
