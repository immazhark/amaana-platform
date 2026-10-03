import { describe, expect, it } from "vitest";
import { reconcileCuratedGalleryPublicRecord } from "@/lib/curated-gallery-reconciliation";

function image(id: string, sortOrder: number, caption = "") {
  return {
    id,
    kind: "IMAGE" as const,
    publicUrl: `/media/2026/${id}.jpg`,
    externalUrl: null,
    altText: `Photograph ${id}`,
    title: null,
    caption,
    sortOrder,
  };
}

describe("curated gallery public rendering reconciliation", () => {
  it("counts only curated gallery assets and keeps them out of the identity slot", () => {
    const curated = new Set(["a", "b"]);
    const result = reconcileCuratedGalleryPublicRecord(
      "aliza-critical-care-support",
      [image("identity", -1000), image("a", 0), image("b", 1)],
      curated,
    );

    expect(result).toEqual({
      slug: "aliza-critical-care-support",
      expected: 2,
      publicSafeCount: 2,
      galleryVisibleCount: 2,
      curatedHeroSelected: false,
      curatedHighlightSelected: false,
      ready: true,
    });
  });

  it("fails closed if a curated record enters the identity slot", () => {
    const curated = new Set(["a", "b"]);
    const result = reconcileCuratedGalleryPublicRecord(
      "aliza-critical-care-support",
      [image("a", -1000), image("b", 1)],
      curated,
    );

    expect(result.curatedHeroSelected).toBe(true);
    expect(result.galleryVisibleCount).toBe(1);
    expect(result.ready).toBe(false);
  });

  it("fails closed if an Eid 2026 curated photograph is diverted into the special highlight slot", () => {
    const ids = Array.from({ length: 9 }, (_, index) => `eid-${index + 1}`);
    const curated = new Set(ids);
    const assets = ids.map((id, index) =>
      image(id, index, index === 0 ? "Beneficiary impact graphic" : ""),
    );

    const result = reconcileCuratedGalleryPublicRecord("eid-gift-kits-2026", assets, curated);

    expect(result.publicSafeCount).toBe(9);
    expect(result.galleryVisibleCount).toBe(8);
    expect(result.curatedHighlightSelected).toBe(true);
    expect(result.ready).toBe(false);
  });
});
