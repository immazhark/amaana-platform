import { isCspCompatiblePublicImageUrl, normalizeSafePublicMediaUrl } from "./public-media";

export type GalleryPublicationCandidate = {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
};

/** Defensive client-side presentation gate. This is NOT media approval:
 * server-side status/consent checks must run before gallery props are built.
 * Reject malformed, private and unconfigured-origin URLs before lightbox or
 * Next's optimizer can receive them. Do not silently proxy remote origins. */
export function selectSafeGalleryImages<T extends GalleryPublicationCandidate>(
  items: readonly T[],
  approvedImageOrigins: readonly string[] = [],
): Array<T & { url: string; alt: string }> {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: Array<T & { url: string; alt: string }> = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (!item || typeof item.id !== "string" || typeof item.alt !== "string" || typeof item.url !== "string") continue;
    // Historical/imported records may violate TypeScript's declared shape.
    // Never pass object-valued captions into React's text nodes.
    if (item.caption != null && (typeof item.caption !== "string" ||
        item.caption.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(item.caption))) continue;
    const id = item.id.trim();
    const alt = item.alt.trim();
    if (id.length > 128 || alt.length > 300 || item.url.length > 2048 ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(alt)) continue;
    const url = normalizeSafePublicMediaUrl(item.url);
    if (!id || !alt || !url) continue;
    // Match PublicMedia's image-host/CSP policy before mounting thumbnail or lightbox.
    if (!isCspCompatiblePublicImageUrl(url, approvedImageOrigins)) continue;
    if (seenIds.has(id) || seenUrls.has(url)) continue;
    seenIds.add(id);
    seenUrls.add(url);
    result.push({ ...item, id, alt, url });
  }
  return result;
}
