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
