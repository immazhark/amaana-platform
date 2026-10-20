import { isPrivateRoute } from "./public-routing";

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

function configuredHttpsOrigin(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

/** Recheck repeatedly decoded paths: routing/proxy layers can decode %61dmin
 * or %252e%252e where the browser URL parser alone sees an ordinary segment.
 * Treat ambiguous/double-encoded paths as private rather than risking a
 * private-origin request. Allow harmless encoding within ordinary filenames. */
function isPrivateAppPath(pathname: string): boolean {
  let candidate = pathname;
  for (let depth = 0; depth < 4; depth++) {
    let path: string;
    try {
      const parsed = new URL(candidate, PUBLIC_MEDIA_RELATIVE_ORIGIN);
      if (parsed.origin !== PUBLIC_MEDIA_RELATIVE_ORIGIN) return true;
      path = parsed.pathname;
    } catch {
      return true;
    }
    if (isPrivateRoute(path) || path === "/_next" || path.startsWith("/_next/")) return true;
    let decoded: string;
    try { decoded = decodeURIComponent(path); }
    catch { return true; }
    if (decoded === path) return false;
    if (decoded.includes("\\") || decoded.includes("//") ||
        decoded.includes("?") || decoded.includes("#") ||
        /[\u0000-\u001F\u007F]/.test(decoded)) return true;
    try {
      const next = new URL(decoded, PUBLIC_MEDIA_RELATIVE_ORIGIN);
      if (next.origin !== PUBLIC_MEDIA_RELATIVE_ORIGIN) return true;
      // %20 in approved filenames is harmless; it normalizes to the same path.
      if (next.pathname === path) return false;
      candidate = next.pathname;
    } catch {
      return true;
    }
  }
  return true;
}

/** The live site's apex and www hostnames can serve the same private routes.
 * A trailing DNS root dot is equivalent for hostname routing, even though
 * URL.origin compares it as a different origin. Other media CDN hosts remain external. */
function isApplicationMediaOrigin(url: URL): boolean {
  const host = url.hostname.replace(/[.]+$/, "").toLowerCase();
  const configuredOrigin = configuredHttpsOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const configuredHost = configuredOrigin
    ? new URL(configuredOrigin).hostname.replace(/[.]+$/, "").toLowerCase()
    : null;
  return host === configuredHost ||
    host === "amaanafoundation.org" || host === "www.amaanafoundation.org";
}

/** Fail closed if a purported public asset resolves into protected app routing.
 * External approved media hosts are not interpreted as this application's
 * private routes. Server-side publication and consent gates remain mandatory. */
export function isPrivateAppMediaUrl(value: string): boolean {
  const normalized = normalizeSafePublicMediaUrl(value);
  if (!normalized) return true;
  let path: string;
  if (normalized.startsWith("/")) {
    path = normalized.split(/[?#]/, 1)[0] ?? "";
  } else {
    const parsed = new URL(normalized);
    // DNS-equivalent Amaana hostnames must never bypass private route checks.
    if (!isApplicationMediaOrigin(parsed)) return false;
    path = parsed.pathname;
  }
  return isPrivateAppPath(path);
}

/** Convert managed same-origin media to relative URLs for Next/Image.
 * Other reviewed HTTPS origins stay direct until explicitly allowlisted. */
export function getPublicImageOptimizationUrl(
  value: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
): string | null {
  const normalized = normalizeSafePublicMediaUrl(value);
  if (!normalized || isPrivateAppMediaUrl(normalized)) return null;

  const isManaged = (pathname: string) =>
    pathname.startsWith("/media/") || pathname.startsWith("/brand/");

  if (normalized.startsWith("/")) {
    return isManaged(normalized.split(/[?#]/, 1)[0] ?? "") ? normalized : null;
  }

  const origin = configuredHttpsOrigin(appUrl);
  if (!origin) return null;
  const url = new URL(normalized);
  if (url.origin !== origin || !isManaged(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isCspCompatiblePublicImageUrl(value: string | null | undefined) {
  const normalized = normalizeSafePublicMediaUrl(value);
  if (!normalized || isPrivateAppMediaUrl(normalized)) return false;
  if (normalized.startsWith("/")) return true;

  const imageOrigin = configuredHttpsOrigin(normalized);
  if (!imageOrigin) return false;

  const allowedOrigins = new Set([
    configuredHttpsOrigin(process.env.NEXT_PUBLIC_APP_URL),
    configuredHttpsOrigin(process.env.PUBLIC_MEDIA_BASE_URL),
  ].filter((origin): origin is string => Boolean(origin)));

  return allowedOrigins.has(imageOrigin);
}

export function canRenderPublicMedia(asset: PublicMediaCandidate) {
  const url = resolvePublicMediaUrl(asset);
  if (!url) return false;

  // Hosted video remains fail-closed until the model can carry a verified,
  // synchronized caption track. Alt/label text alone is not a caption substitute.
  if (asset.kind === "VIDEO") return false;

  if (asset.kind === "IMAGE") {
    return Boolean(asset.altText?.trim()) && isCspCompatiblePublicImageUrl(url);
  }

  return !isPrivateAppMediaUrl(url);
}


/**
 * Prefer documentary photography for high-prominence covers when a reviewed
 * photo and a campaign graphic are both available. This never changes the
 * publication/privacy gate; it only ranks already-public-safe IMAGE assets.
 */
export function isDocumentaryPublicImage(asset: PublicMediaCandidate) {
  if (asset.kind !== "IMAGE" || !canRenderPublicMedia(asset)) return false;
  const descriptor = `${asset.title ?? ""} ${asset.caption ?? ""} ${asset.altText ?? ""}`.toLowerCase();
  return !/(infographic|impact graphic|announcement|campaign cover|results update|thank-you|thank you|poster|\bgraphic\b|\bcarousel\b)/.test(descriptor);
}

export function isIdentityPublicImage(asset: PublicMediaCandidate) {
  return asset.kind === "IMAGE"
    && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER
    && canRenderPublicMedia(asset);
}

export function selectIdentityPublicImage<T extends PublicMediaCandidate>(assets: readonly T[]) {
  // Supporting-gallery approval is not approval for hero/discovery placement.
  return assets.find(asset => isIdentityPublicImage(asset));
}

/**
 * Select a public-safe supporting photograph for lower-prominence gallery/showcase cards.
 * Identity artwork remains the fallback when a record has no separate approved gallery image.
 */
export function selectGalleryPublicImage<T extends PublicMediaCandidate>(assets: readonly T[]) {
  return assets.find(asset => isDocumentaryPublicImage(asset) && !isIdentityPublicImage(asset))
    ?? assets.find(asset => asset.kind === "IMAGE" && canRenderPublicMedia(asset) && !isIdentityPublicImage(asset))
    ?? selectIdentityPublicImage(assets)
    ?? null;
}
