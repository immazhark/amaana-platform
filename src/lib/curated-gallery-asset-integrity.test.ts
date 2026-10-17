import { describe, expect, it } from "vitest";
import { CURATED_GALLERY_BATCH } from "./curated-gallery-identity";
import type { CuratedGalleryRecord } from "./curated-gallery-contract";
import { matchesCuratedGalleryAssetMetadata, type CuratedGalleryAssetMetadata } from "./curated-gallery-server";

const record: CuratedGalleryRecord = {
  id: "curated-" + "a".repeat(32),
  slug: "winter-relief",
  batch: CURATED_GALLERY_BATCH,
  role: "general-gallery",
  sortOrder: 0,
  originalName: "winter-relief-001.jpg",
  relativePath: "winter-relief/001/winter-relief-001.jpg",
  sha256: "b".repeat(64),
  bytes: 1024,
  mimeType: "image/jpeg",
  width: 1200,
  height: 800,
  sourceYear: 2025,
  altText: "Volunteers packing winter kits",
  caption: "Approved documentary photograph",
  isPublic: false,
  privacyApprovedAt: null,
  heroEligible: false,
};
const approved: CuratedGalleryAssetMetadata = {
  altText: record.altText,
  caption: record.caption,
  sourcePath: `owner-curated://${CURATED_GALLERY_BATCH}/${record.sha256}`,
  sourceYear: record.sourceYear,
  width: record.width,
  height: record.height,
  title: null,
  externalUrl: null,
  causeId: null,
  storyId: null,
  faithContentId: null,
};

describe("immutable curated gallery metadata", () => {
  it("permits an exact gallery-only asset on repeated staging/status checks", () => {
    expect(matchesCuratedGalleryAssetMetadata(record, approved)).toBe(true);
  });
  it.each([
    ["altered alt text", { altText: "An unrelated subject" }],
    ["changed caption", { caption: "Unreviewed claim" }],
    ["missing caption", { caption: null }],
    ["changed source path", { sourcePath: "/private/medical-document" }],
    ["changed source year", { sourceYear: 2026 }],
    ["changed width", { width: 800 }],
    ["changed height", { height: 1200 }],
    ["unauthorized title", { title: "Approved hero photograph" }],
    ["external asset URL", { externalUrl: "https://example.com/unreviewed.jpg" }],
    ["cause-level placement", { causeId: "unapproved-cause" }],
    ["story-level placement", { storyId: "unapproved-story" }],
    ["faith editorial placement", { faithContentId: "unapproved-faith" }],
  ] as const)("%s fails closed in every importer endpoint", (_description, drift) => {
    expect(matchesCuratedGalleryAssetMetadata(record, { ...approved, ...drift })).toBe(false);
  });
  it("keeps null captions valid only when the signed manifest permits them", () => {
    expect(matchesCuratedGalleryAssetMetadata({ ...record, caption: null }, { ...approved, caption: null })).toBe(true);
    expect(matchesCuratedGalleryAssetMetadata(record, { ...approved, caption: null })).toBe(false);
  });
});
