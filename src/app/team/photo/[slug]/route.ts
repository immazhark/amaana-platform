import { prisma } from "@/lib/prisma";
import { getPublicMediaObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response(null, { status: 404 });

  const member = await prisma.teamMember.findUnique({
    where: { slug },
    select: { isPublished: true, photoStorageKey: true, photoConsentAt: true },
  });
  if (!member?.isPublished || !member.photoConsentAt || !member.photoStorageKey) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const object = await getPublicMediaObject(member.photoStorageKey);
    if (object.contentType !== "image/webp" || object.bytes.length > 2 * 1024 * 1024) {
      return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(new Uint8Array(object.bytes), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
