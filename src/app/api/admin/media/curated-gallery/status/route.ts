import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
  type CuratedGallerySlug,
} from "@/lib/curated-gallery-contract";
import { reconcileCuratedGalleryPublicRecord } from "@/lib/curated-gallery-reconciliation";
import {
  CURATED_GALLERY_ENTITY_TYPE,
  CURATED_GALLERY_START_ACTION,
  assertCuratedGalleryRuntime,
  deriveCuratedGalleryStorage,
  matchesCuratedGalleryAssetMetadata,
  parseCuratedGallerySessionMetadata,
} from "@/lib/curated-gallery-server";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

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
    const slugs = Object.keys(CURATED_GALLERY_EXPECTED_COUNTS) as CuratedGallerySlug[];
    const curatedIdsBySlug = new Map<CuratedGallerySlug, Set<string>>(
      slugs.map(slug => [
        slug,
        new Set(manifest.records.filter(record => record.slug === slug).map(record => record.id)),
      ]),
    );

    const [assets, publicRecords] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: { id: { in: manifest.records.map(item => item.id) } },
        select: {
          id: true,
          initiative: { select: { slug: true } },
          kind: true,
          storageKey: true,
          publicUrl: true,
          sortOrder: true,
          altText: true,
          caption: true,
          sourcePath: true,
          sourceYear: true,
          width: true,
          height: true,
          title: true,
          externalUrl: true,
          causeId: true,
          storyId: true,
          faithContentId: true,
          isPublic: true,
          privacyApprovedAt: true,
        },
      }),
      prisma.initiative.findMany({
        where: {
          slug: { in: slugs },
          status: "PUBLISHED",
          cause: { status: "PUBLISHED" },
        },
        select: {
          slug: true,
          mediaAssets: {
            where: { isPublic: true, privacyApprovedAt: { not: null } },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              kind: true,
              publicUrl: true,
              externalUrl: true,
              altText: true,
              title: true,
              caption: true,
              sortOrder: true,
            },
          },
        },
      }),
    ]);

    const assetMap = new Map(assets.map(asset => [asset.id, asset]));
    const missing: string[] = [];
    const mismatches: string[] = [];
    const validAssetIds = new Set<string>();

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
          asset.sortOrder < 0 ||
          !matchesCuratedGalleryAssetMetadata(record, asset) ||
          asset.isPublic !== Boolean(asset.privacyApprovedAt)) {
        mismatches.push(record.id);
        continue;
      }
      validAssetIds.add(record.id);
    }

    const publishedBySlug = new Map(publicRecords.map(record => [record.slug, record]));

    const initiatives = slugs.map(slug => {
      const curatedIds = curatedIdsBySlug.get(slug) ?? new Set<string>();
      const uploaded = manifest.records.filter(record =>
        record.slug === slug && validAssetIds.has(record.id),
      ).length;
      const published = assets.filter(asset =>
        curatedIds.has(asset.id) &&
        asset.isPublic &&
        Boolean(asset.privacyApprovedAt),
      ).length;
      const publicRecord = publishedBySlug.get(slug);
      const render = publicRecord
        ? reconcileCuratedGalleryPublicRecord(slug, publicRecord.mediaAssets, curatedIds)
        : {
            slug,
            expected: CURATED_GALLERY_EXPECTED_COUNTS[slug],
            publicSafeCount: 0,
            galleryVisibleCount: 0,
            curatedHeroSelected: false,
            curatedHighlightSelected: false,
            ready: false,
          };

      return {
        slug,
        expected: CURATED_GALLERY_EXPECTED_COUNTS[slug],
        uploaded,
        published,
        publicRecordFound: Boolean(publicRecord),
        publicSafeCount: render.publicSafeCount,
        galleryVisibleCount: render.galleryVisibleCount,
        curatedHeroSelected: render.curatedHeroSelected,
        curatedHighlightSelected: render.curatedHighlightSelected,
        ready:
          uploaded === CURATED_GALLERY_EXPECTED_COUNTS[slug] &&
          published === CURATED_GALLERY_EXPECTED_COUNTS[slug] &&
          render.ready,
      };
    });

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
        galleryOnly: mismatches.length === 0 && assets.every(asset => asset.sortOrder >= 0),
        renderingReady: initiatives.every(item => item.ready),
        initiatives,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    logServerError("curated_gallery.status_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Curated gallery status could not be verified." }, { status: 500, headers: privateHeaders });
  }
}
