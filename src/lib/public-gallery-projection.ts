import { getPublicImageDimensions } from "./public-image-dimensions";
import { canRenderPublicMedia, getPublicImageOptimizationUrl, resolvePublicMediaUrl, type PublicMediaCandidate } from "./public-media";
import { isCampaignGraphicDescriptor } from "./campaign-artwork-descriptor";

/** Project already publication/privacy-approved records into public image cards. */
export function toPublicGalleryItems<T extends PublicMediaCandidate & {
  id: string;
  width?: number | null;
  height?: number | null;
}>(assets: readonly T[]) {
  if (!Array.isArray(assets)) return [];
  const urls = new Set<string>();
  const ids = new Set<string>();
  return assets.flatMap(asset => {
    // Stored media metadata can be malformed despite the TypeScript contract.
    // Reject unsafe records before URL checks, caption projection or styling.
    if (!asset || typeof asset !== "object" || Array.isArray(asset) ||
        typeof asset.id !== "string" || !asset.id.trim() ||
        asset.kind !== "IMAGE" || typeof asset.altText !== "string" ||
        [asset.title, asset.caption, asset.publicUrl, asset.externalUrl].some(
          value => value != null && typeof value !== "string",
        ) ||
        !canRenderPublicMedia(asset)) return [];
    const url = resolvePublicMediaUrl(asset);
    if (!url) return [];
    const displayUrl = getPublicImageOptimizationUrl(url) ?? url;
    if (urls.has(displayUrl) || ids.has(asset.id)) return [];
    urls.add(displayUrl);
    ids.add(asset.id);
    return [{
      id: asset.id,
      url: displayUrl,
      // Already passed server publication and CSP-origin validation above.
      // This public boolean preserves reviewed CDN media during browser hydration.
      ...(displayUrl.startsWith("https://") ? { serverApprovedExternal: true as const } : {}),
      alt: asset.altText ?? null,
      caption: asset.caption,
      // Compute styling from reviewed metadata on the server; never serialize
      // potentially sensitive asset titles into client gallery props.
      graphicArtwork: isCampaignGraphicDescriptor(asset),
      ...getPublicImageDimensions(asset),
    }];
  });
}
