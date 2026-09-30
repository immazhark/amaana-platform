import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { CURATED_GALLERY_BATCH, CURATED_GALLERY_RECORD_COUNT } from "@/lib/curated-gallery-contract";
import {
  CURATED_GALLERY_ENTITY_TYPE,
  CURATED_GALLERY_START_ACTION,
  assertCuratedGalleryRuntime,
  deriveCuratedGalleryStorage,
  parseCuratedGallerySessionMetadata,
} from "@/lib/curated-gallery-server";
import { mediaPublicationIssues, type MediaPublicationReview } from "@/lib/media-governance";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { canRenderPublicMedia } from "@/lib/public-media";
import { isSameOrigin } from "@/lib/request-security";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const inputSchema = z.object({
  confirmation: z.literal("PUBLISH_EXACT_OWNER_CURATED_154"),
}).strict();

const ownerApprovedBatchReview: MediaPublicationReview = {
  privacyClass: "GREEN_PUBLIC",
  consentStatus: "DOCUMENTED",
  websiteApproved: true,
  // Conservative batch-level flags: consent is documented even where a record
  // contains an identifiable child or patient.
  containsMinor: true,
  containsPatient: true,
  containsPrivateDocument: false,
  heroEligible: false,
  provenanceConfirmed: true,
  reviewNotes: "Owner reconfirmed on 2026-09-30 that the exact curated 154-image selection was pre-filtered for privacy concerns and approved for website publication. Gallery use only; no hero/identity/banner/thumbnail approval.",
};

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: privateHeaders });
    if (!hasPermission(user, "content.approve") || !hasPermission(user, "content.update")) {
      return NextResponse.json({ error: "Content approval permission is required." }, { status: 403, headers: privateHeaders });
    }
    assertCuratedGalleryRuntime();

    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Exact curated gallery publication confirmation is required." }, { status: 400, headers: privateHeaders });
    }

    const reviewIssues = mediaPublicationIssues(ownerApprovedBatchReview);
    if (reviewIssues.length) {
      return NextResponse.json({ error: reviewIssues.join(" ") }, { status: 409, headers: privateHeaders });
    }

    const session = await prisma.auditEvent.findFirst({
      where: {
        actorId: user.id,
        action: CURATED_GALLERY_START_ACTION,
        entityType: CURATED_GALLERY_ENTITY_TYPE,
        entityId: CURATED_GALLERY_BATCH,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, metadata: true },
    });
    if (!session) {
      return NextResponse.json({ error: "The verified curated gallery import session is missing." }, { status: 409, headers: privateHeaders });
    }
    const manifest = parseCuratedGallerySessionMetadata(session.metadata);
    if (manifest.records.length !== CURATED_GALLERY_RECORD_COUNT) {
      return NextResponse.json({ error: "The curated gallery manifest record count is invalid." }, { status: 409, headers: privateHeaders });
    }

    const result = await withSerializableTransactionRetry(async tx => {
      const assets = await tx.mediaAsset.findMany({
        where: { id: { in: manifest.records.map(record => record.id) } },
        select: {
          id: true,
          initiative: { select: { slug: true } },
          kind: true,
          publicUrl: true,
          externalUrl: true,
          altText: true,
          title: true,
          caption: true,
          storageKey: true,
          sortOrder: true,
          isPublic: true,
          privacyApprovedAt: true,
          updatedAt: true,
        },
      });
      if (assets.length !== CURATED_GALLERY_RECORD_COUNT) {
        throw new Error(`Expected ${CURATED_GALLERY_RECORD_COUNT} curated media records but found ${assets.length}`);
      }

      const byId = new Map(assets.map(asset => [asset.id, asset]));
      const alreadyPublished: string[] = [];
      const publishable: typeof assets = [];

      for (const record of manifest.records) {
        const asset = byId.get(record.id);
        if (!asset) throw new Error(`Missing curated media record: ${record.id}`);
        const expected = deriveCuratedGalleryStorage(record);
        if (asset.kind !== "IMAGE" ||
            asset.initiative?.slug !== record.slug ||
            asset.storageKey !== expected.storageKey ||
            asset.publicUrl !== expected.publicUrl ||
            asset.sortOrder !== record.sortOrder ||
            asset.sortOrder < 0) {
          throw new Error(`Curated media record drift detected: ${record.id}`);
        }
        if (!canRenderPublicMedia(asset)) throw new Error(`Curated media is not renderable: ${record.id}`);
        if (asset.isPublic) {
          if (!asset.privacyApprovedAt) throw new Error(`Published curated media lacks privacy approval: ${record.id}`);
          alreadyPublished.push(record.id);
        } else {
          if (asset.privacyApprovedAt) throw new Error(`Unpublished curated media has stale privacy approval: ${record.id}`);
          publishable.push(asset);
        }
      }

      const approvedAt = new Date();
      for (const asset of publishable) {
        const claimed = await tx.mediaAsset.updateMany({
          where: { id: asset.id, isPublic: false, privacyApprovedAt: null, updatedAt: asset.updatedAt },
          data: { isPublic: true, privacyApprovedAt: approvedAt },
        });
        if (claimed.count !== 1) throw new Error(`Curated media changed during publication: ${asset.id}`);

        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "media.privacy_reviewed",
            entityType: "MediaAsset",
            entityId: asset.id,
            metadata: {
              ...ownerApprovedBatchReview,
              curatedBatch: CURATED_GALLERY_BATCH,
              importSessionId: session.id,
              galleryOnly: true,
              identityImage: false,
            } as Prisma.InputJsonValue,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "media.published",
            entityType: "MediaAsset",
            entityId: asset.id,
            metadata: {
              privacyGate: "passed",
              curatedBatch: CURATED_GALLERY_BATCH,
              importSessionId: session.id,
              galleryOnly: true,
              identityImage: false,
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "media.curated_batch_published",
          entityType: CURATED_GALLERY_ENTITY_TYPE,
          entityId: CURATED_GALLERY_BATCH,
          metadata: {
            expected: CURATED_GALLERY_RECORD_COUNT,
            publishedNow: publishable.length,
            alreadyPublished: alreadyPublished.length,
            galleryOnly: true,
            heroEligible: false,
            ownerApprovalDate: "2026-09-30",
          } as Prisma.InputJsonValue,
        },
      });

      return { publishedNow: publishable.length, alreadyPublished: alreadyPublished.length };
    });

    revalidatePath("/");
    revalidatePath("/our-work");
    revalidatePath("/impact");
    revalidatePath("/stories");
    revalidatePath("/admin/media");

    return NextResponse.json(
      {
        batch: CURATED_GALLERY_BATCH,
        expected: CURATED_GALLERY_RECORD_COUNT,
        publishedNow: result.publishedNow,
        alreadyPublished: result.alreadyPublished,
        published: result.publishedNow + result.alreadyPublished,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Curated gallery publication failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Curated gallery publication failed safely." },
      { status: 500, headers: privateHeaders },
    );
  }
}
