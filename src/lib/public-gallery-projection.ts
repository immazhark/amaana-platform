import { getPublicImageDimensions } from "./public-image-dimensions";
import { canRenderPublicMedia, getPublicImageOptimizationUrl, resolvePublicMediaUrl, type PublicMediaCandidate } from "./public-media";

/** Project already publication/privacy-approved records into public image cards. */
export function toPublicGalleryItems<T extends PublicMediaCandidate & {
  id: string;
  width?: number | null;
  height?: number | null;
}>(assets: readonly T[]) {
  const urls = new Set<string>();
  const ids = new Set<string>();
  return assets.flatMap(asset => {
    if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) return [];
    const url = resolvePublicMediaUrl(asset);
    if (!url) return [];
    const displayUrl = getPublicImageOptimizationUrl(url) ?? url;
    if (urls.has(displayUrl) || ids.has(asset.id)) return [];
    urls.add(displayUrl);
    ids.add(asset.id);
    return [{
      id: asset.id,
      url: displayUrl,
      alt: asset.altText ?? null,
      caption: asset.caption,
      ...getPublicImageDimensions(asset),
    }];
  });
}
