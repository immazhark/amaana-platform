import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission, getCurrentUser } from "@/lib/auth";
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
  CURATED_GALLERY_PACKAGE_SHA256,
} from "@/lib/curated-gallery-contract";
import {
  CURATED_GALLERY_ENTITY_TYPE,
  CURATED_GALLERY_START_ACTION,
  assertCuratedGalleryRuntime,
  buildCuratedGallerySessionMetadata,
  deriveCuratedGalleryStorage,
  parseCuratedGalleryManifestText,
} from "@/lib/curated-gallery-server";
import { prisma } from "@/lib/prisma";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { isSameOrigin } from "@/lib/request-security";
import { getPublicMediaStorageReadiness } from "@/lib/storage";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const inputSchema = z.object({
  packageSha256: z.literal(CURATED_GALLERY_PACKAGE_SHA256),
  manifestText: z.string().min(1).max(200_000),
}).strict();

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

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, 256 * 1024));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Curated gallery manifest request is too large." }, { status: 413, headers: privateHeaders });
      }
      return NextResponse.json({ error: "Invalid curated gallery manifest request." }, { status: 400, headers: privateHeaders });
    }
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Curated gallery package identity is invalid." }, { status: 400, headers: privateHeaders });
    }

    const manifest = parseCuratedGalleryManifestText(parsed.data.manifestText);
    const slugs = Object.keys(CURATED_GALLERY_EXPECTED_COUNTS);
    const targets = await prisma.initiative.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    if (targets.length !== slugs.length) {
      const found = new Set(targets.map(item => item.slug));
      return NextResponse.json(
        { error: "One or more curated gallery initiatives are missing from staging.", missingSlugs: slugs.filter(slug => !found.has(slug)) },
        { status: 409, headers: privateHeaders },
      );
    }

    const targetIds = new Map(targets.map(item => [item.slug, item.id]));
    const existing = await prisma.mediaAsset.findMany({
      where: { id: { in: manifest.records.map(item => item.id) } },
      select: {
        id: true,
        initiativeId: true,
        storageKey: true,
        publicUrl: true,
        sortOrder: true,
        kind: true,
      },
    });
    const records = new Map(manifest.records.map(item => [item.id, item]));
    for (const asset of existing) {
      const record = records.get(asset.id);
      if (!record) throw new Error("Existing curated asset is outside the approved manifest");
      const expectedStorage = deriveCuratedGalleryStorage(record);
      if (asset.kind !== "IMAGE" ||
          asset.initiativeId !== targetIds.get(record.slug) ||
          asset.storageKey !== expectedStorage.storageKey ||
          asset.publicUrl !== expectedStorage.publicUrl ||
          asset.sortOrder !== record.sortOrder) {
        return NextResponse.json(
          { error: "An existing curated MediaAsset conflicts with the approved package.", recordId: asset.id },
          { status: 409, headers: privateHeaders },
        );
      }
    }

    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: CURATED_GALLERY_START_ACTION,
        entityType: CURATED_GALLERY_ENTITY_TYPE,
        entityId: CURATED_GALLERY_BATCH,
        metadata: buildCuratedGallerySessionMetadata(manifest) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      {
        ready: true,
        batch: CURATED_GALLERY_BATCH,
        records: manifest.records.length,
        initiatives: slugs.length,
        existing: existing.length,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Curated gallery start failed", error);
    return NextResponse.json({ error: "Curated gallery import could not be initialized safely." }, { status: 500, headers: privateHeaders });
  }
}
