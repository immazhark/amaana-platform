import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { CURATED_GALLERY_BATCH } from "@/lib/curated-gallery-contract";
import {
  CURATED_GALLERY_ENTITY_TYPE,
  CURATED_GALLERY_START_ACTION,
  assertCuratedGalleryRuntime,
  curatedGalleryRecordById,
  deriveCuratedGalleryStorage,
  parseCuratedGallerySessionMetadata,
} from "@/lib/curated-gallery-server";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { isSameOrigin } from "@/lib/request-security";
import { MAX_FILE_BYTES, getPublicMediaStorageReadiness, uploadCuratedPublicMediaFile } from "@/lib/storage";
import { logServerError } from "@/lib/server-log";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 512 * 1024;
const CURATED_UPLOAD_TIMEOUT_MS = 120_000;

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: privateHeaders });
    if (!hasPermission(user, "content.update") || !hasPermission(user, "content.approve")) {
      return NextResponse.json({ error: "Content approval permission is required." }, { status: 403, headers: privateHeaders });
    }

    assertCuratedGalleryRuntime();
    const storage = getPublicMediaStorageReadiness();
    if (!storage.uploadReady || !storage.separateBucketConfigured) {
      return NextResponse.json({ error: "Dedicated public-media storage is not ready." }, { status: 503, headers: privateHeaders });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      return NextResponse.json({ error: "Curated image upload must use multipart form data." }, { status: 400, headers: privateHeaders });
    }

    let body: Uint8Array;
    try {
      // One absolute deadline covers the full multipart transport, even when
      // the client periodically sends more bytes to keep the connection alive.
      body = await readBodyBytesWithLimit(request, MAX_MULTIPART_BYTES, {
        timeoutMs: CURATED_UPLOAD_TIMEOUT_MS,
      });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Curated image upload is too large." }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        return NextResponse.json(
          { error: "Curated image upload timed out. Please try again." },
          { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
        );
      }
      // Transport failure is distinct from a complete malformed multipart.
      // No gallery session, object storage, or database work has started.
      return NextResponse.json(
        { error: "Curated image upload could not be read. Please try again." },
        { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
      );
    }
    const boundedBody = new ArrayBuffer(body.byteLength);
    new Uint8Array(boundedBody).set(body);
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body: boundedBody,
    });

    let form: FormData;
    try {
      form = await boundedRequest.formData();
    } catch {
      return NextResponse.json({ error: "Curated image upload could not be parsed." }, { status: 400, headers: privateHeaders });
    }

    const batchFields = form.getAll("batch");
    const recordIdFields = form.getAll("recordId");
    const fileFields = form.getAll("file");
    // Do not silently accept the first of contradictory approved-batch,
    // record-identity or evidence-file entries.
    if (
      batchFields.length !== 1 || typeof batchFields[0] !== "string" ||
      recordIdFields.length !== 1 || typeof recordIdFields[0] !== "string" ||
      fileFields.length > 1 || (fileFields.length === 1 && !(fileFields[0] instanceof File))
    ) {
      return NextResponse.json({ error: "Curated image upload contains ambiguous fields." }, { status: 400, headers: privateHeaders });
    }
    if (batchFields[0] !== CURATED_GALLERY_BATCH) {
      return NextResponse.json({ error: "Curated gallery batch is invalid." }, { status: 400, headers: privateHeaders });
    }
    const recordId = recordIdFields[0].trim();
    const fileEntry = fileFields[0];
    if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
      return NextResponse.json({ error: "Curated image file is required." }, { status: 400, headers: privateHeaders });
    }

    const session = await prisma.auditEvent.findFirst({
      where: {
        actorId: user.id,
        action: CURATED_GALLERY_START_ACTION,
        entityType: CURATED_GALLERY_ENTITY_TYPE,
        entityId: CURATED_GALLERY_BATCH,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { metadata: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Initialize and verify the curated ZIP before uploading." }, { status: 409, headers: privateHeaders });
    }
    const manifest = parseCuratedGallerySessionMetadata(session.metadata);
    const record = curatedGalleryRecordById(manifest, recordId);
    if (fileEntry.name !== record.originalName || fileEntry.type !== record.mimeType || fileEntry.size !== record.bytes) {
      return NextResponse.json({ error: "Curated image metadata does not match the approved manifest." }, { status: 409, headers: privateHeaders });
    }

    const storageIdentity = deriveCuratedGalleryStorage(record);
    const uploaded = await uploadCuratedPublicMediaFile(fileEntry, storageIdentity.storageKey, record.sha256);
    const result = await withSerializableTransactionRetry(async tx => {
      const initiative = await tx.initiative.findUnique({ where: { slug: record.slug }, select: { id: true } });
      if (!initiative) throw new Error(`Missing initiative: ${record.slug}`);

      const existing = await tx.mediaAsset.findUnique({ where: { id: record.id } });
      if (existing) {
        if (existing.initiativeId !== initiative.id ||
            existing.kind !== "IMAGE" ||
            existing.storageKey !== storageIdentity.storageKey ||
            existing.publicUrl !== storageIdentity.publicUrl ||
            existing.sortOrder !== record.sortOrder) {
          throw new Error("Existing curated media record conflicts with the approved package");
        }
        return { created: false, isPublic: existing.isPublic };
      }

      await tx.mediaAsset.create({
        data: {
          id: record.id,
          initiativeId: initiative.id,
          kind: "IMAGE",
          publicUrl: storageIdentity.publicUrl,
          storageKey: storageIdentity.storageKey,
          altText: record.altText,
          caption: record.caption || null,
          sourcePath: `owner-curated://${CURATED_GALLERY_BATCH}/${record.sha256}`,
          sourceYear: record.sourceYear,
          width: record.width,
          height: record.height,
          sortOrder: record.sortOrder,
          isPublic: false,
          privacyApprovedAt: null,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "media.created",
          entityType: "MediaAsset",
          entityId: record.id,
          metadata: {
            target: { initiativeId: initiative.id },
            uploaded: true,
            curatedBatch: CURATED_GALLERY_BATCH,
            packageSha256: session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
              ? (session.metadata as Prisma.JsonObject).packageSha256
              : null,
            sha256: record.sha256,
            galleryOnly: true,
            identityImage: false,
          } as Prisma.InputJsonValue,
        },
      });
      return { created: true, isPublic: false };
    });

    return NextResponse.json(
      {
        recordId: record.id,
        slug: record.slug,
        created: result.created,
        isPublic: result.isPublic,
        storageKey: uploaded.objectKey,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    logServerError("curated_gallery.upload_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Curated image could not be imported safely." }, { status: 500, headers: privateHeaders });
  }
}
