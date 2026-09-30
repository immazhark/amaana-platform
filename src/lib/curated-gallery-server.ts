import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
  CURATED_GALLERY_MANIFEST_SHA256,
  CURATED_GALLERY_PACKAGE_SHA256,
  curatedGalleryManifestSchema,
  type CuratedGalleryManifest,
  type CuratedGalleryRecord,
} from "@/lib/curated-gallery-contract";

export const CURATED_GALLERY_ENTITY_TYPE = "CuratedGalleryBatch";
export const CURATED_GALLERY_START_ACTION = "media.curated_import_started";
export const CURATED_GALLERY_REQUIRED_SERVICE_ID = "fcb9d167-eba1-40c8-a4e6-ac35af470989";

export function sha256Hex(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseCuratedGalleryManifestText(manifestText: string) {
  if (sha256Hex(manifestText) !== CURATED_GALLERY_MANIFEST_SHA256) {
    throw new Error("Curated gallery manifest checksum does not match the owner-approved package");
  }
  return curatedGalleryManifestSchema.parse(JSON.parse(manifestText));
}

export function assertCuratedGalleryRuntime() {
  if (process.env.APP_ENVIRONMENT !== "staging") {
    throw new Error("Curated gallery import is restricted to the staging application");
  }
  if (process.env.RAILWAY_SERVICE_ID !== CURATED_GALLERY_REQUIRED_SERVICE_ID) {
    throw new Error("Curated gallery import is restricted to the designated preview service");
  }
}

export function deriveCuratedGalleryStorage(record: CuratedGalleryRecord) {
  const digest = sha256Hex(`${record.id}/${record.sha256}`).slice(0, 32);
  const keyId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20)}`;
  const extension = record.mimeType === "image/png" ? "png" : "jpg";
  const storageKey = `2026/${keyId}.${extension}`;
  return { storageKey, publicUrl: `/media/${storageKey}` };
}

export function buildCuratedGallerySessionMetadata(manifest: CuratedGalleryManifest) {
  return {
    packageSha256: CURATED_GALLERY_PACKAGE_SHA256,
    manifestSha256: CURATED_GALLERY_MANIFEST_SHA256,
    batch: CURATED_GALLERY_BATCH,
    initiativeCounts: CURATED_GALLERY_EXPECTED_COUNTS,
    manifest,
    galleryOnly: true,
    heroEligible: false,
  } satisfies Prisma.InputJsonObject;
}

export function parseCuratedGallerySessionMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Curated gallery import session metadata is missing");
  }
  const value = metadata as Record<string, unknown>;
  if (value.packageSha256 !== CURATED_GALLERY_PACKAGE_SHA256 ||
      value.manifestSha256 !== CURATED_GALLERY_MANIFEST_SHA256 ||
      value.batch !== CURATED_GALLERY_BATCH ||
      value.galleryOnly !== true ||
      value.heroEligible !== false) {
    throw new Error("Curated gallery import session does not match the approved package");
  }
  return curatedGalleryManifestSchema.parse(value.manifest);
}

export function curatedGalleryRecordById(manifest: CuratedGalleryManifest, recordId: string) {
  const record = manifest.records.find(item => item.id === recordId);
  if (!record) throw new Error("Curated media ID is not part of the approved package");
  return record;
}
