import { z } from "zod";
const CURATED_MAX_FILE_BYTES = 5 * 1024 * 1024;
const CURATED_MAX_IMAGE_PIXELS = 40_000_000;

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

const curatedGalleryRecordSchema = z.object({
  id: z.string().regex(/^curated-[a-f0-9]{32}$/),
  slug: z.string().min(1),
  batch: z.string().min(1).max(120),
  role: z.literal("general-gallery"),
  sortOrder: z.number().int().min(0),
  originalName: z.string().min(1).max(255),
  relativePath: z.string().min(1).max(700),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().min(1).max(CURATED_MAX_FILE_BYTES),
  mimeType: z.enum(["image/jpeg", "image/png"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sourceYear: z.number().int().min(2000).max(2100).nullable(),
  altText: z.string().trim().min(1).max(300),
  caption: z.string().max(1000).nullable(),
  isPublic: z.literal(false),
  privacyApprovedAt: z.null(),
  heroEligible: z.literal(false),
}).strict();

export const curatedGalleryManifestSchema = z.object({
  version: z.literal(1),
  batch: z.literal(CURATED_GALLERY_BATCH),
  status: z.literal("prepared-unpublished"),
  records: z.array(curatedGalleryRecordSchema).length(CURATED_GALLERY_RECORD_COUNT),
}).strict().superRefine((manifest, ctx) => {
  const ids = new Set<string>();
  const orderKeys = new Set<string>();
  const counts = new Map<string, number>();

  for (const [index, record] of manifest.records.entries()) {
    if (!(record.slug in CURATED_GALLERY_EXPECTED_COUNTS)) {
      ctx.addIssue({ code: "custom", path: ["records", index, "slug"], message: "Unexpected initiative slug" });
      continue;
    }
    if (ids.has(record.id)) {
      ctx.addIssue({ code: "custom", path: ["records", index, "id"], message: "Duplicate curated media ID" });
    }
    ids.add(record.id);

    const orderKey = `${record.slug}/${record.sortOrder}`;
    if (orderKeys.has(orderKey)) {
      ctx.addIssue({ code: "custom", path: ["records", index, "sortOrder"], message: "Duplicate initiative gallery order" });
    }
    orderKeys.add(orderKey);

    if (record.width > CURATED_MAX_IMAGE_PIXELS / record.height) {
      ctx.addIssue({ code: "custom", path: ["records", index, "width"], message: "Image exceeds pixel safety limit" });
    }
    if (record.originalName.includes("/") || record.originalName.includes("\\")) {
      ctx.addIssue({ code: "custom", path: ["records", index, "originalName"], message: "Original name cannot contain path separators" });
    }
    const parts = record.relativePath.split("/");
    if (record.relativePath.startsWith("/") || record.relativePath.includes("\\") ||
        parts.some(part => !part || part === "." || part === "..")) {
      ctx.addIssue({ code: "custom", path: ["records", index, "relativePath"], message: "Unsafe curated relative path" });
    }
    const expectedPrefix = `${record.slug}/${String(record.sortOrder + 1).padStart(3, "0")}/`;
    if (!record.relativePath.startsWith(expectedPrefix) || !record.relativePath.endsWith(`/${record.originalName}`)) {
      ctx.addIssue({ code: "custom", path: ["records", index, "relativePath"], message: "Curated relative path does not match initiative/order/name" });
    }

    counts.set(record.slug, (counts.get(record.slug) ?? 0) + 1);
  }

  for (const [slug, expected] of Object.entries(CURATED_GALLERY_EXPECTED_COUNTS)) {
    if ((counts.get(slug) ?? 0) !== expected) {
      ctx.addIssue({ code: "custom", path: ["records"], message: `Count mismatch for ${slug}` });
    }
  }
});

export type CuratedGalleryManifest = z.infer<typeof curatedGalleryManifestSchema>;
export type CuratedGalleryRecord = CuratedGalleryManifest["records"][number];

export function archivePathForCuratedRecord(record: CuratedGalleryRecord) {
  return `.curated-media/originals/${record.relativePath}`;
}
