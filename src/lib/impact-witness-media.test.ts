import { describe, expect, it } from "vitest";
import { IDENTITY_MEDIA_SORT_ORDER } from "./public-media";
import { selectImpactWitnessMedia } from "./impact-witness-media";

function record(id: string, sortOrder: number, altText: string | null = "Reviewed public photograph") {
  const image = {
    kind: "IMAGE" as const,
    publicUrl: `/media/${id}.webp`,
    altText,
    sortOrder,
    title: id,
  };
  return { id, mediaAssets: [image] };
}

describe("impact witness media selection", () => {
  it("does not render an empty witness section for gallery-only approved images", () => {
    const galleryOnly = record("gallery-only", 10);
    expect(selectImpactWitnessMedia([galleryOnly])).toEqual([]);
  });

  it("keeps the existing identity media gate for invalid alt text and private URLs", () => {
    const missingAlt = record("missing-alt", IDENTITY_MEDIA_SORT_ORDER, "");
    const privateLink = {
      id: "private",
      mediaAssets: [{
        kind: "IMAGE" as const,
        publicUrl: "/admin/private.webp",
        altText: "Sensitive photograph",
        sortOrder: IDENTITY_MEDIA_SORT_ORDER,
      }],
    };
    const valid = record("published", IDENTITY_MEDIA_SORT_ORDER);
    const results = selectImpactWitnessMedia([missingAlt, privateLink, valid]);
    expect(results).toHaveLength(1);
    expect(results[0]?.record.id).toBe("published");
    expect(results[0]?.media).toBe(valid.mediaAssets[0]);
  });

  it("fills six visible slides from later eligible records while preserving order", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) => record(`gallery-${i}`, 20)),
      ...Array.from({ length: 9 }, (_, i) => record(`identity-${i}`, IDENTITY_MEDIA_SORT_ORDER)),
    ];
    expect(selectImpactWitnessMedia(records).map(({ record }) => record.id)).toEqual([
      "identity-0", "identity-1", "identity-2", "identity-3", "identity-4", "identity-5",
    ]);
  });
});
