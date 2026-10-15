import { CURATED_GALLERY_MANIFEST_SHA256 } from "./curated-gallery-identity";
import type { CuratedGalleryManifest } from "./curated-gallery-contract";

/** Authenticate the fixed owner-approved bytes before interpreting any paths.
 * The import endpoint independently applies the complete manifest schema before
 * recording an import session; that server validator does not belong in JS.
 */
export async function readApprovedCuratedManifest(bytes: Uint8Array) {
  // Own the bytes across the asynchronous digest so callers cannot change the
  // authenticated content between checksum verification and JSON decoding.
  const snapshot = Uint8Array.from(bytes);
  const digest = await crypto.subtle.digest("SHA-256", snapshot);
  const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  if (checksum !== CURATED_GALLERY_MANIFEST_SHA256) {
    throw new Error("Manifest SHA-256 does not match the approved package.");
  }
  const manifestText = new TextDecoder("utf-8", { fatal: true }).decode(snapshot);
  const manifest = JSON.parse(manifestText) as CuratedGalleryManifest;
  return { manifest, manifestText };
}

/** Validate every value the administrative importer uses before showing progress
 * or offering the irreversible publication action. Keep this dependency-light:
 * the importer is in the constrained client bundle. */
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
  CURATED_GALLERY_RECORD_COUNT,
} from "./curated-gallery-identity";

export type CuratedGalleryStatus = {
  initialized: boolean;
  expected: number;
  uploaded: number;
  published: number;
  missing: number;
  mismatches: string[];
  galleryOnly: boolean;
  renderingReady: boolean;
  initiatives: Array<{
    slug: string;
    expected: number;
    uploaded: number;
    published: number;
    publicRecordFound: boolean;
    publicSafeCount: number;
    galleryVisibleCount: number;
    curatedHeroSelected: boolean;
    curatedHighlightSelected: boolean;
    ready: boolean;
  }>;
};

export function parseCuratedGalleryStatus(value: unknown): CuratedGalleryStatus {
  const invalid = (): never => { throw new Error("Curated gallery status response is invalid. Refresh before proceeding."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const data = value as Record<string, unknown>;
  const count = (source: Record<string, unknown>, key: string, max: number) => {
    const n = source[key];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > max) return invalid();
    return n;
  };
  const total = CURATED_GALLERY_RECORD_COUNT;
  const uploaded = count(data, "uploaded", total);
  const published = count(data, "published", total);
  const missing = count(data, "missing", total);
  if (published > uploaded || uploaded + missing > total) return invalid();

  if (data.initialized === false) {
    if (uploaded !== 0 || published !== 0 || missing !== total) return invalid();
    return {
      initialized: false, expected: total, uploaded, published, missing,
      mismatches: [], galleryOnly: false, renderingReady: false, initiatives: [],
    };
  }
  if (data.initialized !== true || data.batch !== CURATED_GALLERY_BATCH ||
      count(data, "expected", total) !== total ||
      typeof data.galleryOnly !== "boolean" || typeof data.renderingReady !== "boolean" ||
      !Array.isArray(data.mismatches) || data.mismatches.length > total ||
      !data.mismatches.every((id: unknown) => typeof id === "string" && /^curated-[a-f0-9]{32}$/.test(id)) ||
      !Array.isArray(data.initiatives)) return invalid();

  const counts: Record<string, number> = CURATED_GALLERY_EXPECTED_COUNTS;
  const seen = new Set<string>();
  const mismatchIds = new Set(data.mismatches as string[]);
  if (mismatchIds.size !== (data.mismatches as string[]).length) return invalid();
  if (data.initiatives.length !== Object.keys(counts).length) return invalid();
  const initiatives = data.initiatives.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return invalid();
    const entry = item as Record<string, unknown>;
    const slug = entry.slug;
    if (typeof slug !== "string" || !Object.hasOwn(counts, slug) || seen.has(slug)) return invalid();
    seen.add(slug);
    const expected = counts[slug];
    if (count(entry, "expected", total) !== expected ||
        typeof entry.ready !== "boolean" ||
        typeof entry.publicRecordFound !== "boolean" ||
        typeof entry.curatedHeroSelected !== "boolean" ||
        typeof entry.curatedHighlightSelected !== "boolean") return invalid();
    const itemUploaded = count(entry, "uploaded", expected);
    const itemPublished = count(entry, "published", expected);
    // Drifted records may be published but excluded from the verified-upload
    // count. Surface that discrepancy instead of hiding the status screen.
    if (entry.ready && (itemUploaded !== expected || itemPublished !== expected ||
        entry.publicSafeCount !== expected || entry.galleryVisibleCount !== expected ||
        !entry.publicRecordFound || entry.curatedHeroSelected || entry.curatedHighlightSelected)) return invalid();
    return {
      slug, expected, uploaded: itemUploaded, published: itemPublished,
      publicRecordFound: entry.publicRecordFound as boolean,
      publicSafeCount: count(entry, "publicSafeCount", expected),
      galleryVisibleCount: count(entry, "galleryVisibleCount", expected),
      curatedHeroSelected: entry.curatedHeroSelected as boolean,
      curatedHighlightSelected: entry.curatedHighlightSelected as boolean,
      ready: entry.ready as boolean,
    };
  });
  const verifiedUploads = initiatives.reduce((sum, item) => sum + item.uploaded, 0);
  const itemPublished = initiatives.reduce((sum, item) => sum + item.published, 0);
  if (uploaded + missing !== total || verifiedUploads + mismatchIds.size !== uploaded ||
      itemPublished !== published) return invalid();
  if (data.renderingReady && (published !== total || missing !== 0 || mismatchIds.size !== 0 ||
      !data.galleryOnly || !initiatives.every(item => item.ready))) return invalid();
  return {
    initialized: true, expected: total, uploaded, published, missing,
    mismatches: data.mismatches as string[],
    galleryOnly: data.galleryOnly, renderingReady: data.renderingReady,
    initiatives,
  };
}
