import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { CURATED_GALLERY_BATCH } from "@/lib/curated-gallery-contract";
import {
  CURATED_GALLERY_ENTITY_TYPE,
  CURATED_GALLERY_START_ACTION,
  assertCuratedGalleryRuntime,
  deriveCuratedGalleryStorage,
  parseCuratedGallerySessionMetadata,
} from "@/lib/curated-gallery-server";
import { prisma } from "@/lib/prisma";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: privateHeaders });
    if (!hasPermission(user, "content.update") || !hasPermission(user, "content.approve")) {
      return NextResponse.json({ error: "Content approval permission is required." }, { status: 403, headers: privateHeaders });
    }
    assertCuratedGalleryRuntime();

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
      return NextResponse.json({ initialized: false, uploaded: 0, published: 0, missing: 154 }, { headers: privateHeaders });
    }
    const manifest = parseCuratedGallerySessionMetadata(session.metadata);
    const assets = await prisma.mediaAsset.findMany({
      where: { id: { in: manifest.records.map(item => item.id) } },
      select: {
        id: true,
        initiative: { select: { slug: true } },
        kind: true,
        storageKey: true,
        publicUrl: true,
        sortOrder: true,
        isPublic: true,
        privacyApprovedAt: true,
      },
    });
    const assetMap = new Map(assets.map(asset => [asset.id, asset]));
    const missing: string[] = [];
    const mismatches: string[] = [];
    const perInitiative = new Map<string, number>();

    for (const record of manifest.records) {
      const asset = assetMap.get(record.id);
      if (!asset) {
        missing.push(record.id);
        continue;
      }
      const expected = deriveCuratedGalleryStorage(record);
      if (asset.kind !== "IMAGE" ||
          asset.initiative?.slug !== record.slug ||
          asset.storageKey !== expected.storageKey ||
          asset.publicUrl !== expected.publicUrl ||
          asset.sortOrder !== record.sortOrder ||
          asset.sortOrder < 0) {
        mismatches.push(record.id);
        continue;
      }
      perInitiative.set(record.slug, (perInitiative.get(record.slug) ?? 0) + 1);
    }

    return NextResponse.json(
      {
        initialized: true,
        batch: CURATED_GALLERY_BATCH,
        expected: manifest.records.length,
        uploaded: assets.length,
        published: assets.filter(asset => asset.isPublic && asset.privacyApprovedAt).length,
        missing: missing.length,
        missingIds: missing,
        mismatches,
        galleryOnly: assets.every(asset => asset.sortOrder >= 0),
        perInitiative: Object.fromEntries(perInitiative),
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Curated gallery status failed", error);
    return NextResponse.json({ error: "Curated gallery status could not be verified." }, { status: 500, headers: privateHeaders });
  }
}
