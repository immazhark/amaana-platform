import { describe, expect, it } from "vitest";
import { parseCuratedGalleryStatus } from "./curated-gallery-browser";
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
  CURATED_GALLERY_RECORD_COUNT,
} from "./curated-gallery-identity";

function statusFixture(mode: "empty" | "staged" | "published" = "empty") {
  const uploaded = mode === "empty" ? 0 : CURATED_GALLERY_RECORD_COUNT;
  const published = mode === "published" ? CURATED_GALLERY_RECORD_COUNT : 0;
  return {
    initialized: true, batch: CURATED_GALLERY_BATCH,
    expected: CURATED_GALLERY_RECORD_COUNT, uploaded, published,
    missing: CURATED_GALLERY_RECORD_COUNT - uploaded,
    mismatches: [] as string[], galleryOnly: true,
    renderingReady: mode === "published",
    initiatives: Object.entries(CURATED_GALLERY_EXPECTED_COUNTS).map(([slug, expected]) => ({
      slug, expected,
      uploaded: mode === "empty" ? 0 : expected,
      published: mode === "published" ? expected : 0,
      publicRecordFound: mode === "published",
      publicSafeCount: mode === "published" ? expected : 0,
      galleryVisibleCount: mode === "published" ? expected : 0,
      curatedHeroSelected: false, curatedHighlightSelected: false,
      ready: mode === "published",
    })),
  };
}

describe("owner-curated gallery status: fail closed before publication", () => {
  it("accepts the authentic uninitialized response without inventing permission", () => {
    const status = parseCuratedGalleryStatus({ initialized: false, uploaded: 0, published: 0, missing: 154 });
    expect(status.initialized).toBe(false);
    expect(status.galleryOnly).toBe(false);
    expect(status.initiatives).toEqual([]);
  });

  it.each(["empty", "staged", "published"] as const)("accepts coherent %s status", mode => {
    const status = statusFixture(mode);
    expect(parseCuratedGalleryStatus(status).uploaded).toBe(status.uploaded);
    expect(parseCuratedGalleryStatus(status).renderingReady).toBe(mode === "published");
  });

  it("keeps an already published but drifted gallery inspectable instead of claiming it ready", () => {
    const status = statusFixture("published");
    status.mismatches.push("curated-" + "a".repeat(32));
    status.initiatives[0].uploaded -= 1;
    status.initiatives[0].ready = false;
    status.renderingReady = false;
    expect(parseCuratedGalleryStatus(status).initiatives[0].uploaded).toBe(status.initiatives[0].expected - 1);
  });

  it.each([
    ["negative counts", (s: ReturnType<typeof statusFixture>) => { s.uploaded = -1; }],
    ["fractional counts", (s: ReturnType<typeof statusFixture>) => { s.uploaded = 0.5; }],
    ["impossible missing count", (s: ReturnType<typeof statusFixture>) => { s.missing = 153; }],
    ["published exceeds uploaded", (s: ReturnType<typeof statusFixture>) => { s.published = 1; }],
    ["missing initiative", (s: ReturnType<typeof statusFixture>) => { s.initiatives.pop(); }],
    ["duplicate initiative", (s: ReturnType<typeof statusFixture>) => { s.initiatives[1].slug = s.initiatives[0].slug; }],
    ["invalid mismatch ID", (s: ReturnType<typeof statusFixture>) => { s.mismatches = ["../../../etc/passwd"]; }],
    ["invalid item count", (s: ReturnType<typeof statusFixture>) => { s.initiatives[0].uploaded = 500; }],
    ["invalid batch", (s: ReturnType<typeof statusFixture>) => { s.batch = "unapproved"; }],
  ])("rejects %s", (_name, alter) => {
    const status = statusFixture();
    alter(status);
    expect(() => parseCuratedGalleryStatus(status)).toThrow("status response is invalid");
  });

  it("rejects unverifiable false-positive public readiness", () => {
    const status = statusFixture("published");
    status.initiatives[0].curatedHeroSelected = true;
    expect(() => parseCuratedGalleryStatus(status)).toThrow();
    status.initiatives[0].curatedHeroSelected = false;
    status.initiatives[0].ready = false;
    expect(() => parseCuratedGalleryStatus(status)).toThrow();
  });

  it("rejects duplicate drift IDs instead of double-counting them", () => {
    const status = statusFixture("staged");
    status.mismatches = Array(2).fill("curated-" + "a".repeat(32));
    expect(() => parseCuratedGalleryStatus(status)).toThrow();
  });

  it("rejects object or array responses without showing the publish action", () => {
    expect(() => parseCuratedGalleryStatus(null)).toThrow();
    expect(() => parseCuratedGalleryStatus([])).toThrow();
    expect(() => parseCuratedGalleryStatus({})).toThrow();
  });
});
