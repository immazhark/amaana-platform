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
  const total = CURATED_GALLERY_RECORD_COUNT;
  const validCount = (n: unknown, max = total): n is number =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  if (!validCount(data.uploaded) || !validCount(data.published) ||
      !validCount(data.missing) || data.uploaded + data.missing !== total ||
      data.published > data.uploaded) return invalid();

  if (data.initialized === false) {
    if (data.uploaded || data.published || data.missing !== total) return invalid();
    return { initialized: false, expected: total, uploaded: 0, published: 0,
      missing: total, mismatches: [], galleryOnly: false, renderingReady: false, initiatives: [] };
  }

  if (data.initialized !== true || data.batch !== CURATED_GALLERY_BATCH ||
      data.expected !== total || typeof data.galleryOnly !== "boolean" ||
      typeof data.renderingReady !== "boolean" || !Array.isArray(data.mismatches) ||
      data.mismatches.length > total || !Array.isArray(data.initiatives)) return invalid();
  const mismatches: unknown[] = data.mismatches;
  if (mismatches.some(id => typeof id !== "string" || !/^curated-[a-f0-9]{32}$/.test(id)) ||
      new Set(mismatches).size !== mismatches.length) return invalid();

  const counts: Record<string, number> = CURATED_GALLERY_EXPECTED_COUNTS;
  const initiatives: unknown[] = data.initiatives;
  if (initiatives.length !== Object.keys(counts).length) return invalid();
  const seen = new Set<string>();
  let verified = 0;
  let published = 0;
  let ready = true;
  for (const item of initiatives) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return invalid();
    const entry = item as Record<string, unknown>;
    const slug = entry.slug;
    if (typeof slug !== "string" || !Object.hasOwn(counts, slug) || seen.has(slug)) return invalid();
    const expected = counts[slug];
    if (expected === undefined || entry.expected !== expected ||
        !validCount(entry.uploaded, expected) || !validCount(entry.published, expected) ||
        !validCount(entry.publicSafeCount, expected) || !validCount(entry.galleryVisibleCount, expected) ||
        typeof entry.ready !== "boolean" || typeof entry.publicRecordFound !== "boolean" ||
        typeof entry.curatedHeroSelected !== "boolean" ||
        typeof entry.curatedHighlightSelected !== "boolean") return invalid();
    seen.add(slug);
    verified += entry.uploaded;
    published += entry.published;
    if (entry.ready && (entry.uploaded !== expected || entry.published !== expected ||
        entry.publicSafeCount !== expected || entry.galleryVisibleCount !== expected ||
        !entry.publicRecordFound || entry.curatedHeroSelected || entry.curatedHighlightSelected)) return invalid();
    ready = ready && entry.ready;
  }
  if (verified + mismatches.length !== data.uploaded || published !== data.published ||
      (data.renderingReady && (!ready || !data.galleryOnly ||
        data.missing !== 0 || data.published !== total || mismatches.length !== 0))) return invalid();
  // Only expose server fields after validating every value used by the review UI.
  return data as unknown as CuratedGalleryStatus;
}
