import { strictObject, string, int, literal, nullable, array, regex, minLength, maxLength, minimum, maximum, positive, trim, length, superRefine, enum as enumeration } from "zod/mini";
import type { infer as Infer } from "zod/mini";
const CURATED_MAX_FILE_BYTES = 5 * 1024 * 1024;
const CURATED_MAX_IMAGE_PIXELS = 40_000_000;

import { CURATED_GALLERY_BATCH, CURATED_GALLERY_EXPECTED_COUNTS, CURATED_GALLERY_RECORD_COUNT } from "./curated-gallery-identity";
export * from "./curated-gallery-identity";

const curatedGalleryRecordSchema = strictObject({
  id: string().check(regex(/^curated-[a-f0-9]{32}$/)),
  slug: string().check(minLength(1)),
  batch: string().check(minLength(1), maxLength(120)),
  role: literal("general-gallery"),
  sortOrder: int().check(minimum(0)),
  originalName: string().check(minLength(1), maxLength(255)),
  relativePath: string().check(minLength(1), maxLength(700)),
  sha256: string().check(regex(/^[a-f0-9]{64}$/)),
  bytes: int().check(minimum(1), maximum(CURATED_MAX_FILE_BYTES)),
  mimeType: enumeration(["image/jpeg", "image/png"]),
  width: int().check(positive()),
  height: int().check(positive()),
  sourceYear: nullable(int().check(minimum(2000), maximum(2100))),
  altText: string().check(trim(), minLength(1), maxLength(300)),
  caption: nullable(string().check(maxLength(1000))),
  isPublic: literal(false),
  privacyApprovedAt: literal(null),
  heroEligible: literal(false),
});

export const curatedGalleryManifestSchema = strictObject({
  version: literal(1),
  batch: literal(CURATED_GALLERY_BATCH),
  status: literal("prepared-unpublished"),
  records: array(curatedGalleryRecordSchema).check(length(CURATED_GALLERY_RECORD_COUNT)),
}).check(superRefine((manifest, ctx) => {
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
}));

export type CuratedGalleryManifest = Infer<typeof curatedGalleryManifestSchema>;
export type CuratedGalleryRecord = CuratedGalleryManifest["records"][number];
