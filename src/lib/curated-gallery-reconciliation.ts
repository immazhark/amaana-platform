import {
  CURATED_GALLERY_EXPECTED_COUNTS,
  type CuratedGallerySlug,
} from "@/lib/curated-gallery-contract";
import {
  canRenderPublicMedia,
  resolvePublicMediaUrl,
  selectIdentityPublicImage,
  type PublicMediaCandidate,
} from "@/lib/public-media";

export type CuratedGalleryRenderableAsset = PublicMediaCandidate & {
  id: string;
};

export type CuratedGalleryRenderReconciliation = {
  slug: CuratedGallerySlug;
  expected: number;
  publicSafeCount: number;
  galleryVisibleCount: number;
  curatedHeroSelected: boolean;
  curatedHighlightSelected: boolean;
  ready: boolean;
};

export function reconcileCuratedGalleryPublicRecord(
  slug: CuratedGallerySlug,
  mediaAssets: readonly CuratedGalleryRenderableAsset[],
  curatedIds: ReadonlySet<string>,
): CuratedGalleryRenderReconciliation {
  const media = mediaAssets
    .filter(canRenderPublicMedia)
    .filter((asset, index, list) => {
      const url = resolvePublicMediaUrl(asset);
      return Boolean(url) && list.findIndex(other => resolvePublicMediaUrl(other) === url) === index;
    });

  const lead = selectIdentityPublicImage(media);
  const highlight = slug === "eid-gift-kits-2026"
    ? media.find(asset => /beneficiar|impact graphic/i.test(`${asset.title ?? ""} ${asset.caption ?? ""}`))
    : undefined;
  const gallery = media.filter(asset => asset.id !== lead?.id && asset.id !== highlight?.id);

  const publicSafeCount = media.filter(asset => curatedIds.has(asset.id)).length;
  const galleryVisibleCount = gallery.filter(asset => curatedIds.has(asset.id)).length;
  const curatedHeroSelected = Boolean(lead && curatedIds.has(lead.id));
  const curatedHighlightSelected = Boolean(highlight && curatedIds.has(highlight.id));
  const expected = CURATED_GALLERY_EXPECTED_COUNTS[slug];

  return {
    slug,
    expected,
    publicSafeCount,
    galleryVisibleCount,
    curatedHeroSelected,
    curatedHighlightSelected,
    ready:
      publicSafeCount === expected &&
      galleryVisibleCount === expected &&
      !curatedHeroSelected &&
      !curatedHighlightSelected,
  };
}
