import { canRenderPublicMedia, resolvePublicMediaUrl, type PublicMediaCandidate } from "./public-media";

type GalleryImageAsset = PublicMediaCandidate & {
  id: string;
  width?: number | null;
  height?: number | null;
};

/** Keep the reviewed image geometry when projecting public gallery records. */
export function toPublicGalleryItems<T extends GalleryImageAsset>(assets: readonly T[]) {
  return assets.flatMap(asset => {
    if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) return [];
    const url = resolvePublicMediaUrl(asset);
    if (!url) return [];

    return [{
      id: asset.id,
      url,
      alt: asset.altText ?? null,
      caption: asset.caption,
      width: asset.width ?? null,
      height: asset.height ?? null,
    }];
  });
}
