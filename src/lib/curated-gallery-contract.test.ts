import { describe, expect, it } from "vitest";
import {
  CURATED_GALLERY_EXPECTED_COUNTS,
  CURATED_GALLERY_RECORD_COUNT,
  curatedGalleryManifestSchema,
} from "@/lib/curated-gallery-contract";
import { deriveCuratedGalleryStorage } from "@/lib/curated-gallery-server";

const sample = {
  id: `curated-${"a".repeat(32)}`,
  slug: "oral-cancer-surgery-support",
  batch: "2026-09-29-general-01",
  role: "general-gallery" as const,
  sortOrder: 0,
  originalName: "sample.jpg",
  relativePath: "oral-cancer-surgery-support/001/sample.jpg",
  sha256: "b".repeat(64),
  bytes: 100,
  mimeType: "image/jpeg" as const,
  width: 100,
  height: 100,
  sourceYear: null,
  altText: "Programme photograph",
  caption: null,
  isPublic: false as const,
  privacyApprovedAt: null,
  heroEligible: false as const,
};

function validManifest() {
  const records = Object.entries(CURATED_GALLERY_EXPECTED_COUNTS).flatMap(([slug, count], slugIndex) =>
    Array.from({ length: count }, (_, index) => ({
      ...sample,
      id: `curated-${(slugIndex * 20 + index + 1).toString(16).padStart(32, "0")}`,
      slug,
      sortOrder: index,
      originalName: `image-${index + 1}.jpg`,
      relativePath: `${slug}/${String(index + 1).padStart(3, "0")}/image-${index + 1}.jpg`,
    })),
  );
  return { version: 1 as const, batch: "owner-curated-2026-09-30" as const, status: "prepared-unpublished" as const, records };
}

describe("curated gallery contract", () => {
  it("locks the owner-approved initiative counts to 154 gallery records", () => {
    const manifest = curatedGalleryManifestSchema.parse(validManifest());
    expect(manifest.records).toHaveLength(CURATED_GALLERY_RECORD_COUNT);
    expect(manifest.records.filter(item => item.slug === "oral-cancer-surgery-support")).toHaveLength(1);
    expect(manifest.records.every(item => item.role === "general-gallery" && !item.heroEligible && item.sortOrder >= 0)).toBe(true);
  });

  it("rejects hero/public state and initiative-count drift", () => {
    const base = validManifest();
    const hero = {
      ...base,
      records: base.records.map((record, index) => index === 0 ? { ...record, heroEligible: true } : record),
    };
    expect(curatedGalleryManifestSchema.safeParse(hero).success).toBe(false);

    const drift = validManifest();
    drift.records.pop();
    expect(curatedGalleryManifestSchema.safeParse(drift).success).toBe(false);
  });

  it.each([
    { id: "invalid" }, { sha256: "not-a-hash" }, { sortOrder: -1 }, { sortOrder: 0.5 },
    { bytes: 0 }, { bytes: 5 * 1024 * 1024 + 1 }, { width: 0 }, { height: 1.5 },
    { width: 40_000_001 }, { sourceYear: 1999 }, { sourceYear: 2101 },
    { originalName: "../image.jpg" }, { relativePath: "../image.jpg" },
    { relativePath: "/absolute.jpg" }, { altText: "   " }, { altText: "a".repeat(301) },
    { caption: "a".repeat(1001) }, { mimeType: "image/svg+xml" }, { isPublic: true },
    { privacyApprovedAt: "2026-10-04" }, { extraField: true }, { slug: "unknown" },
  ])("retains strict publication and decoded-media safety checks for %j", mutation => {
    const manifest = validManifest();
    const record = manifest.records[0];
    if (!record) throw new Error("Expected a curated gallery fixture record.");
    Object.assign(record, mutation);
    expect(curatedGalleryManifestSchema.safeParse(manifest).success).toBe(false);
  });

  it("retains duplicate/order guards and trims valid alternative text", () => {
    const duplicate = validManifest();
    const duplicateFirst = duplicate.records[0];
    const duplicateSecond = duplicate.records[1];
    if (!duplicateFirst || !duplicateSecond) throw new Error("Expected duplicate-guard fixture records.");
    duplicateSecond.id = duplicateFirst.id;
    expect(curatedGalleryManifestSchema.safeParse(duplicate).success).toBe(false);
    const order = validManifest();
    const orderFirst = order.records[0];
    const orderSecond = order.records[1];
    if (!orderFirst || !orderSecond) throw new Error("Expected order-guard fixture records.");
    orderSecond.sortOrder = orderFirst.sortOrder;
    expect(curatedGalleryManifestSchema.safeParse(order).success).toBe(false);
    const manifest = validManifest();
    const firstRecord = manifest.records[0];
    if (!firstRecord) throw new Error("Expected an alt-text fixture record.");
    firstRecord.altText = "  Programme photograph  ";
    const parsedFirst = curatedGalleryManifestSchema.parse(manifest).records[0];
    if (!parsedFirst) throw new Error("Expected parsed curated gallery record.");
    expect(parsedFirst.altText).toBe("Programme photograph");
    expect(curatedGalleryManifestSchema.safeParse({ ...manifest, unexpected: true }).success).toBe(false);
  });

  it("derives deterministic managed storage keys without identity ordering", () => {
    const record = {
      ...sample,
      id: "curated-9ae35bea112e2d1db3dd1fcc6493c8db",
      sha256: "fed2240f7ed64e93b7b4ace44f85839406559095ed2c044b9aaf433e212b0bd4",
      mimeType: "image/png" as const,
    };
    expect(deriveCuratedGalleryStorage(record)).toEqual({
      storageKey: "2026/decff651-9c5b-7fda-f549-6069e8aeb135.png",
      publicUrl: "/media/2026/decff651-9c5b-7fda-f549-6069e8aeb135.png",
    });
  });
});
