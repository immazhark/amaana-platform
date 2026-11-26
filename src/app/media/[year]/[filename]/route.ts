import { prisma } from "@/lib/prisma";
import { canRenderPublicMedia } from "@/lib/public-media";
import { getPublicMediaObject, isManagedPublicMediaKey } from "@/lib/storage";
import { logServerError } from "@/lib/server-log";
import { parseManagedImageWidth } from "@/lib/managed-image-variants";
import { renderManagedImage, withManagedImageSlot } from "@/lib/managed-image-render";

const notFoundHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function contentTypeForKey(objectKey: string) {
  if (objectKey.endsWith(".pdf")) return "application/pdf";
  if (objectKey.endsWith(".jpg")) return "image/jpeg";
  if (objectKey.endsWith(".png")) return "image/png";
  if (objectKey.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function notFound() {
  return new Response(null, { status: 404, headers: notFoundHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; filename: string }> },
) {
  const { year, filename } = await params;
  const objectKey = `${year}/${filename}`;
  if (!isManagedPublicMediaKey(objectKey)) return notFound();
  const width = parseManagedImageWidth(new URL(request.url).search);
  if (width === null || (width !== undefined && contentTypeForKey(objectKey) === "application/pdf")) return notFound();
  try {
    // Admission happens before the publication lookup, so queued requests do not reuse stale approval.
    return width === undefined ? await serveApprovedMedia(objectKey) : await withManagedImageSlot(() => serveApprovedMedia(objectKey, width));
  } catch (error) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return notFound();
    logServerError("public_media.serve_failed", { errorName: error instanceof Error ? error.name : "unknown" });
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
  }
}

async function serveApprovedMedia(objectKey: string, width?: number) {
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      storageKey: objectKey,
      isPublic: true,
      privacyApprovedAt: { not: null },
    },
    select: {
      kind: true,
      publicUrl: true,
      externalUrl: true,
      altText: true,
    },
  });

  if (!asset || !canRenderPublicMedia(asset) || (width !== undefined && asset.kind !== "IMAGE")) return notFound();
  const object = await getPublicMediaObject(objectKey);
  const expectedContentType = contentTypeForKey(objectKey);
  if (object.contentType.toLowerCase() !== expectedContentType) {
    logServerError("public_media.content_type_mismatch", {
      expectedContentType,
      storedContentType: object.contentType,
    });
    return new Response(null, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const bytes = width === undefined ? object.bytes : await renderManagedImage(object.bytes, expectedContentType, width);
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": "inline",
    "Content-Length": String(bytes.byteLength),
    "Content-Type": width === undefined ? expectedContentType : "image/webp",
    "X-Content-Type-Options": "nosniff",
  });
  // Original-object validators cannot describe transformed bytes.
  if (width === undefined && object.etag) headers.set("ETag", object.etag);
  if (width === undefined && object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());

  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, { status: 200, headers });
}
