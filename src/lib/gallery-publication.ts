import { isCspCompatiblePublicImageUrl, normalizeSafePublicMediaUrl } from "./public-media";

export type GalleryPublicationCandidate = {
  id: string;
  url: string;
  alt: string | null;
};

/** Defensive client-side presentation gate. This is NOT media approval:
 * server-side status/consent checks must run before gallery props are built.
 * Reject malformed, private and unconfigured-origin URLs before lightbox or
 * Next's optimizer can receive them. Do not silently proxy remote origins. */
export function selectSafeGalleryImages<T extends GalleryPublicationCandidate>(
  items: readonly T[],
): Array<T & { url: string; alt: string }> {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: Array<T & { url: string; alt: string }> = [];
  for (const item of items) {
    if (!item || typeof item.id !== "string" || typeof item.alt !== "string" || typeof item.url !== "string") continue;
    const id = item.id.trim();
    const alt = item.alt.trim();
    const url = normalizeSafePublicMediaUrl(item.url);
    if (!id || !alt || !url) continue;
    // Match PublicMedia's image-host/CSP policy before mounting thumbnail or lightbox.
    if (!isCspCompatiblePublicImageUrl(url)) continue;
    if (seenIds.has(id) || seenUrls.has(url)) continue;
    seenIds.add(id);
    seenUrls.add(url);
    result.push({ ...item, id, alt, url });
  }
  return result;
}
