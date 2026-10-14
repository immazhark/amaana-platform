import { isPrivateRoute } from "./public-routing";
import { normalizeSafePublicMediaUrl } from "./public-media";

export type GalleryPublicationCandidate = {
  id: string;
  url: string;
  alt: string | null;
};

/** Defensive client-side presentation gate. This is NOT media approval:
 * server-side status/consent checks must run before gallery props are built.
 * Reject malformed/private URLs and undescribed images before lightbox or
 * Next's optimizer can receive them. Do not silently proxy remote origins. */
export function selectSafeGalleryImages<T extends GalleryPublicationCandidate>(
  items: readonly T[],
): Array<T & { url: string; alt: string }> {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: Array<T & { url: string; alt: string }> = [];
  for (const item of items) {
    if (!item || typeof item.id !== "string" || typeof item.alt !== "string") continue;
    const id = item.id.trim();
    const alt = item.alt.trim();
    const url = normalizeSafePublicMediaUrl(item.url);
    if (!id || !alt || !url) continue;
    const privatePath = url.startsWith("/") ? url.split(/[?#]/, 1)[0] : null;
    if (privatePath && (isPrivateRoute(privatePath) || privatePath.startsWith("/_next/"))) continue;
    if (seenIds.has(id) || seenUrls.has(url)) continue;
    seenIds.add(id);
    seenUrls.add(url);
    result.push({ ...item, id, alt, url });
  }
  return result;
}
