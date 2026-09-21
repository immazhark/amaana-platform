export type PublicMediaCandidate = {
  kind: "IMAGE" | "VIDEO" | "DOCUMENT" | "EXTERNAL_VIDEO";
  publicUrl?: string | null;
  externalUrl?: string | null;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  sortOrder?: number | null;
};

export const IDENTITY_MEDIA_SORT_ORDER = -1000;

function isSafePublicUrl(value: string | null | undefined) {
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolvePublicMediaUrl(asset: PublicMediaCandidate) {
  if (asset.kind === "EXTERNAL_VIDEO") {
    return isSafePublicUrl(asset.externalUrl) ? asset.externalUrl! : null;
  }

  return isSafePublicUrl(asset.publicUrl) ? asset.publicUrl! : null;
}

export function canRenderPublicMedia(asset: PublicMediaCandidate) {
  const url = resolvePublicMediaUrl(asset);
  if (!url) return false;

  // Hosted video remains fail-closed until the model can carry a verified,
  // synchronized caption track. Alt/label text alone is not a caption substitute.
  if (asset.kind === "VIDEO") return false;

  if (asset.kind === "IMAGE") {
    return Boolean(asset.altText?.trim());
  }

  return true;
}


/**
 * Prefer documentary photography for high-prominence covers when a reviewed
 * photo and a campaign graphic are both available. This never changes the
 * publication/privacy gate; it only ranks already-public-safe IMAGE assets.
 */
export function isDocumentaryPublicImage(asset: PublicMediaCandidate) {
  if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) return false;
  const descriptor = `${asset.title ?? ""} ${asset.caption ?? ""}`.toLowerCase();
  return !/(infographic|impact graphic|announcement|campaign cover|results update|thank-you|thank you|poster)/.test(descriptor);
}

export function isIdentityPublicImage(asset: PublicMediaCandidate) {
  return asset.kind === "IMAGE"
    && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER
    && canRenderPublicMedia(asset);
}

export function selectIdentityPublicImage<T extends PublicMediaCandidate>(assets: readonly T[]) {
  return assets.find(asset => isIdentityPublicImage(asset))
    ?? assets.find(asset => isDocumentaryPublicImage(asset))
    ?? assets.find(asset => asset.kind === "IMAGE" && canRenderPublicMedia(asset));
}
