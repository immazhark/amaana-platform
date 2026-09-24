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

const PUBLIC_MEDIA_RELATIVE_ORIGIN = "https://amaana.invalid";

export function normalizeSafePublicMediaUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw || /[\\\u0000-\u001F\u007F\s]/.test(raw)) return null;

  try {
    if (raw.startsWith("/")) {
      if (raw.startsWith("//")) return null;
      const url = new URL(raw, PUBLIC_MEDIA_RELATIVE_ORIGIN);
      if (url.origin !== PUBLIC_MEDIA_RELATIVE_ORIGIN) return null;
      return `${url.pathname}${url.search}${url.hash}`;
    }

    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function resolvePublicMediaUrl(asset: PublicMediaCandidate) {
  return normalizeSafePublicMediaUrl(
    asset.kind === "EXTERNAL_VIDEO" ? asset.externalUrl : asset.publicUrl,
  );
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
