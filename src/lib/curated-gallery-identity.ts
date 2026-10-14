import type { CuratedGalleryRecord } from "./curated-gallery-contract";

export const CURATED_GALLERY_PACKAGE_SHA256 = "1216eed498c6f5ea0378c1e236137faf455ece735aaeefea8bb2c08d5472ff6f";
export const CURATED_GALLERY_PACKAGE_BYTES = 147_133_042;
export const CURATED_GALLERY_MANIFEST_SHA256 = "e6a9594137df28ded4c81b0d1e2c34837f585add778acec40f94fdf51477173e";
export const CURATED_GALLERY_BATCH = "owner-curated-2026-09-30";
export const CURATED_GALLERY_RECORD_COUNT = 154;
export const CURATED_GALLERY_ARCHIVE_ENTRY_COUNT = 156;

export const CURATED_GALLERY_EXPECTED_COUNTS = {
  "aliza-critical-care-support": 2,
  "auto-rickshaw-livelihood-support": 3,
  "dates-distribution-2023": 9,
  "dates-distribution-2024": 4,
  "dates-distribution-2025": 4,
  "dates-distribution-2026": 9,
  "eid-gift-kits-2020": 7,
  "eid-gift-kits-2021": 7,
  "eid-gift-kits-2022": 11,
  "eid-gift-kits-2023": 9,
  "eid-gift-kits-2024": 8,
  "eid-gift-kits-2025": 8,
  "eid-gift-kits-2026": 9,
  "emergency-neonatal-medical-aid": 1,
  "hyderabad-flood-relief-2020": 13,
  "jewellery-loan-intervention": 4,
  "oral-cancer-surgery-support": 1,
  "qurbani-meat-distribution-2025": 13,
  "qurbani-meat-distribution-2026": 10,
  "severe-burn-treatment-support": 1,
  "taleem-initiative-2025": 8,
  "winter-relief": 13,
} as const;

export type CuratedGallerySlug = keyof typeof CURATED_GALLERY_EXPECTED_COUNTS;

export function archivePathForCuratedRecord(record: CuratedGalleryRecord) {
  return `.curated-media/originals/${record.relativePath}`;
}
