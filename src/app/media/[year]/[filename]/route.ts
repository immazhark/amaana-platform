import { prisma } from "@/lib/prisma";
import { canRenderPublicMedia } from "@/lib/public-media";
import { getPublicMediaObject, isManagedPublicMediaKey } from "@/lib/storage";

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
  _request: Request,
  { params }: { params: Promise<{ year: string; filename: string }> },
) {
  const { year, filename } = await params;
  const objectKey = `${year}/${filename}`;
  if (!isManagedPublicMediaKey(objectKey)) return notFound();

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

  if (!asset || !canRenderPublicMedia(asset)) return notFound();

  try {
    const object = await getPublicMediaObject(objectKey);
    const headers = new Headers({
      "Cache-Control": "public, max-age=60, s-maxage=300, must-revalidate",
      "Content-Disposition": "inline",
      "Content-Length": String(object.bytes.byteLength),
      "Content-Type": contentTypeForKey(objectKey),
      "X-Content-Type-Options": "nosniff",
    });
    if (object.etag) headers.set("ETag", object.etag);
    if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());

    const body = new ArrayBuffer(object.bytes.byteLength);
    new Uint8Array(body).set(object.bytes);
    return new Response(body, { status: 200, headers });
  } catch (error) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return notFound();
    console.error("Unable to serve approved public media", error);
    return new Response(null, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }
}
