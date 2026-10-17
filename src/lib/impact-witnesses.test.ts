import { describe, expect, it } from "vitest";
import { selectImpactWitnesses } from "./impact-witnesses";
import { IDENTITY_MEDIA_SORT_ORDER } from "./public-media";

describe("Impact photo and featured-image publication discipline", () => {
  const source = { kind: "IMAGE" as const, publicUrl: "/media/approved.webp",
    altText: "Packing approved relief kits", sortOrder: IDENTITY_MEDIA_SORT_ORDER };
  it("never opens a witness section for gallery-only images", () => {
    const galleryOnly = { slug: "a", mediaAssets: [{ ...source, sortOrder: 1 }] };
    expect(selectImpactWitnesses([galleryOnly])).toEqual([]);
  });
  it("uses the first publishable identity asset and ignores unsafe/missing descriptions", () => {
    const records = [
      { slug: "gallery-only", mediaAssets: [{ ...source, sortOrder: 1 }] },
      { slug: "no-alt", mediaAssets: [{ ...source, altText: null }] },
      { slug: "private", mediaAssets: [{ ...source, publicUrl: "/admin/secret.webp" }] },
      { slug: "approved", mediaAssets: [source] },
    ];
    const rows = selectImpactWitnesses(records);
    expect(rows.map(row => row.item.slug)).toEqual(["approved"]);
    expect(rows[0]?.media.publicUrl).toBe(source.publicUrl);
  });
  it("stops at the supported six-tile carousel limit", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ slug: String(i), mediaAssets: [source] }));
    expect(selectImpactWitnesses(rows).map(row => row.item.slug)).toEqual(["0", "1", "2", "3", "4", "5"]);
  });
});
