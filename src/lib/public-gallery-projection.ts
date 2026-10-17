import { canRenderPublicMedia, resolvePublicMediaUrl, type PublicMediaCandidate } from "./public-media";

/**
 * Preserve the reviewed media record's responsive dimensions and bounded
 * ingestion preview in every programme and story gallery.
 *
 * Approval remains the caller's responsibility: this only projects records
 * that the public publication/CSP gate allows to be displayed. The gallery
 * component independently revalidates URLs at the browser boundary.
 */
export function toPublicGalleryItems<T extends PublicMediaCandidate & {
  id: string;
  width?: number | null;
  height?: number | null;
  blurDataURL?: string | null;
}>(assets: readonly T[]) {
  return assets.flatMap(asset => {
    if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) return [];
    const url = resolvePublicMediaUrl(asset);
    if (!url) return [];
    return [{
      id: asset.id,
      url,
      alt: asset.altText ?? null,
      caption: asset.caption,
      width: asset.width,
      height: asset.height,
      blurDataURL: asset.blurDataURL,
    }];
  });
}
