import { canRenderPublicMedia, isDocumentaryPublicImage, isIdentityPublicImage, resolvePublicMediaUrl, type PublicMediaCandidate } from "./public-media";

/** Rank only already-published assets. Individual banners never use collages. */
export function selectInitiativeBannerImage<T extends PublicMediaCandidate & { width?: number | null; height?: number | null }>(assets: readonly T[]) {
  let selected: T | undefined;
  let bestScore = -1;
  for (const asset of assets) {
    if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) continue;
    const description = `${asset.title ?? ""} ${asset.caption ?? ""} ${asset.altText ?? ""} ${resolvePublicMediaUrl(asset) ?? ""}`;
    if (/collage|composite|diagonal-v\d|\/programme-artwork\/|\/hero\//i.test(description)) continue;
    const documentary = isDocumentaryPublicImage(asset);
    // Use the same 10,000-edge / 40 MP bounds as public image rendering and ingestion.
    const landscape = typeof asset.width === "number" && Number.isSafeInteger(asset.width) && asset.width > 0 && asset.width <= 10_000
      && typeof asset.height === "number" && Number.isSafeInteger(asset.height) && asset.height > 0 && asset.height <= 10_000
      && asset.width <= 40_000_000 / asset.height && asset.width >= asset.height;
    const score = (documentary ? 4 : 0) + (isIdentityPublicImage(asset) ? 2 : 0) + (landscape ? 1 : 0);
    if (score > bestScore) { selected = asset; bestScore = score; }
  }
  return selected;
}
