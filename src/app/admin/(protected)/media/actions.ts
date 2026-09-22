"use server";

import { MediaKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hasPermission, requirePermission } from "@/lib/auth";
import { mediaPublicationIssues, parseMediaPublicationReview } from "@/lib/media-governance";
import { prisma } from "@/lib/prisma";
import { IDENTITY_MEDIA_SORT_ORDER, canRenderPublicMedia } from "@/lib/public-media";
import { deletePublicMediaObject, uploadPublicMediaFile, validatePublicMediaFile } from "@/lib/storage";

type TargetFields = { causeId?: string; initiativeId?: string; storyId?: string; faithContentId?: string };

function targetFields(value: string): TargetFields {
  const [kind, id] = value.split(":", 2);
  if (!id) throw new Error("Choose a content target");
  if (kind === "cause") return { causeId: id };
  if (kind === "initiative") return { initiativeId: id };
  if (kind === "story") return { storyId: id };
  if (kind === "faith") return { faithContentId: id };
  throw new Error("Unsupported content target");
}

function safePublicUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error("Public media URL must use HTTPS or a root-relative path");
  }
}

function optionalText(value: FormDataEntryValue | null, max: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

export async function createMediaAsset(formData: FormData) {
  const user = await requirePermission("content.update");
  const target = targetFields(String(formData.get("target") ?? ""));
  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const manualUrl = safePublicUrl(formData.get("publicUrl"));
  if (!file && !manualUrl) throw new Error("Upload a file or provide an approved public URL");

  const requestedKind = String(formData.get("kind") ?? "IMAGE");
  const inferredKind: MediaKind = file?.type === "application/pdf" ? "DOCUMENT" : requestedKind === "DOCUMENT" ? "DOCUMENT" : "IMAGE";
  if (file) validatePublicMediaFile(file);
  if (file && inferredKind === "DOCUMENT" && file.type !== "application/pdf") throw new Error("Document media must be uploaded as PDF");
  if (file && inferredKind === "IMAGE" && file.type === "application/pdf") throw new Error("Image media must use JPEG, PNG or WebP");

  const altText = optionalText(formData.get("altText"), 300);
  if (inferredKind === "IMAGE" && !altText) throw new Error("Image alt text is required");
  const sourceYearRaw = Number(formData.get("sourceYear"));
  const sortOrderRaw = Number(formData.get("sortOrder"));
  const identityImage = inferredKind === "IMAGE" && formData.get("identityImage") === "on";
  const displayOrder = identityImage
    ? IDENTITY_MEDIA_SORT_ORDER
    : Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : 0;

  const uploaded = file ? await uploadPublicMediaFile(file) : null;

  try {
    await prisma.$transaction(async tx => {
      if (identityImage) {
        await tx.mediaAsset.updateMany({
          where: { kind: "IMAGE", sortOrder: IDENTITY_MEDIA_SORT_ORDER, ...target },
          data: { sortOrder: 0 },
        });
      }

      const asset = await tx.mediaAsset.create({
        data: {
          kind: inferredKind,
          title: optionalText(formData.get("title"), 160),
          publicUrl: manualUrl ?? uploaded?.publicUrl ?? null,
          storageKey: uploaded?.objectKey ?? null,
          altText,
          caption: optionalText(formData.get("caption"), 1000),
          sourcePath: optionalText(formData.get("sourcePath"), 500) ?? uploaded?.originalName ?? null,
          sourceYear: Number.isInteger(sourceYearRaw) && sourceYearRaw >= 2000 && sourceYearRaw <= 2100 ? sourceYearRaw : null,
          width: uploaded?.width ?? null,
          height: uploaded?.height ?? null,
          sortOrder: displayOrder,
          isPublic: false,
          ...target,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "media.created",
          entityType: "MediaAsset",
          entityId: asset.id,
          metadata: { target, uploaded: Boolean(uploaded), hasPublicUrl: Boolean(asset.publicUrl), identityImage },
        },
      });
    });
  } catch (error) {
    if (uploaded?.objectKey) {
      try {
        await deletePublicMediaObject(uploaded.objectKey);
      } catch (cleanupError) {
        console.error("Public media record creation failed and uploaded-object cleanup also failed", cleanupError);
      }
    }
    throw error;
  }

  revalidatePath("/admin/media");
}

export async function updateMediaAsset(formData: FormData) {
  const user = await requirePermission("content.update");
  const id = String(formData.get("id") ?? "");
  const asset = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
  if (asset.isPublic && !hasPermission(user, "content.approve")) throw new Error("Published media requires approval permission to edit");

  const publicUrl = safePublicUrl(formData.get("publicUrl"));
  const altText = optionalText(formData.get("altText"), 300);
  if (asset.kind === "IMAGE" && !altText) throw new Error("Image alt text is required");
  const sourceYearRaw = Number(formData.get("sourceYear"));
  const sortOrderRaw = Number(formData.get("sortOrder"));
  const identityImage = asset.kind === "IMAGE" && formData.get("identityImage") === "on";
  const displayOrder = identityImage
    ? IDENTITY_MEDIA_SORT_ORDER
    : Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : 0;
  const target = {
    causeId: asset.causeId ?? undefined,
    initiativeId: asset.initiativeId ?? undefined,
    storyId: asset.storyId ?? undefined,
    faithContentId: asset.faithContentId ?? undefined,
  };

  await prisma.$transaction(async tx => {
    if (identityImage) {
      await tx.mediaAsset.updateMany({
        where: { id: { not: id }, kind: "IMAGE", sortOrder: IDENTITY_MEDIA_SORT_ORDER, ...target },
        data: { sortOrder: 0 },
      });
    }
    await tx.mediaAsset.update({ where: { id }, data: {
      title: optionalText(formData.get("title"), 160), publicUrl, altText,
      caption: optionalText(formData.get("caption"), 1000), sourcePath: optionalText(formData.get("sourcePath"), 500),
      sourceYear: Number.isInteger(sourceYearRaw) && sourceYearRaw >= 2000 && sourceYearRaw <= 2100 ? sourceYearRaw : null,
      sortOrder: displayOrder,
    } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "media.metadata_updated", entityType: "MediaAsset", entityId: id, metadata: { wasPublic: asset.isPublic, identityImage } } });
  });
  revalidatePath("/admin/media");
}

export async function setMediaPublication(formData: FormData) {
  const user = await requirePermission("content.approve");
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "true";
  const asset = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } });

  if (publish && !canRenderPublicMedia(asset)) {
    throw new Error(asset.kind === "VIDEO"
      ? "Hosted video publication is disabled until synchronized caption tracks are supported and verified."
      : "Media needs a safe public URL and, for images, meaningful alt text before publication.");
  }

  if (publish) {
    const review = parseMediaPublicationReview(formData);
    const issues = mediaPublicationIssues(review);
    if (issues.length) throw new Error(issues.join(" "));
    if (asset.kind === "IMAGE" && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER && !review.heroEligible) {
      throw new Error("The designated identity image requires explicit Hero use approved confirmation before publication.");
    }

    await prisma.$transaction([
      prisma.mediaAsset.update({ where: { id }, data: { isPublic: true, privacyApprovedAt: new Date() } }),
      prisma.auditEvent.create({ data: {
        actorId: user.id,
        action: "media.privacy_reviewed",
        entityType: "MediaAsset",
        entityId: id,
        metadata: review,
      } }),
      prisma.auditEvent.create({ data: { actorId: user.id, action: "media.published", entityType: "MediaAsset", entityId: id, metadata: { privacyGate: "passed" } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.mediaAsset.update({ where: { id }, data: { isPublic: false, privacyApprovedAt: null } }),
      prisma.auditEvent.create({ data: { actorId: user.id, action: "media.unpublished", entityType: "MediaAsset", entityId: id } }),
    ]);
  }

  revalidatePath("/admin/media");
  revalidatePath("/");
  revalidatePath("/our-work");
  revalidatePath("/impact");
  revalidatePath("/stories");
  revalidatePath("/faith-and-reflections");
}

export async function deleteMediaAsset(formData: FormData) {
  const user = await requirePermission("content.approve");
  const id = String(formData.get("id") ?? "").trim();
  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (!id) throw new Error("Media record is required");
  if (confirmation !== "DELETE") throw new Error("Type DELETE to confirm permanent media deletion");

  const asset = await prisma.mediaAsset.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      isPublic: true,
      storageKey: true,
      publicUrl: true,
      title: true,
      sourcePath: true,
    },
  });

  if (asset.isPublic) throw new Error("Unpublish this media before permanent deletion");

  // Record the destructive intent before storage deletion so a partial failure
  // remains diagnosable even when the managed object is already gone.
  await prisma.auditEvent.create({
    data: {
      actorId: user.id,
      action: "media.deletion_started",
      entityType: "MediaAsset",
      entityId: id,
      metadata: {
        storageManaged: Boolean(asset.storageKey),
        hadPublicUrl: Boolean(asset.publicUrl),
        title: asset.title,
        sourcePath: asset.sourcePath,
      },
    },
  });

  // Managed object deletion is intentionally first: DeleteObject is idempotent, so
  // if the following database transaction fails the visible record remains and an
  // approver can safely retry without leaving an unreachable storage object behind.
  if (asset.storageKey) await deletePublicMediaObject(asset.storageKey);

  await prisma.$transaction([
    prisma.mediaAsset.delete({ where: { id } }),
    prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "media.deleted",
        entityType: "MediaAsset",
        entityId: id,
        metadata: {
          storageManaged: Boolean(asset.storageKey),
          hadPublicUrl: Boolean(asset.publicUrl),
          title: asset.title,
          sourcePath: asset.sourcePath,
        },
      },
    }),
  ]);

  revalidatePath("/admin/media");
  revalidatePath("/");
  revalidatePath("/our-work");
  revalidatePath("/impact");
  revalidatePath("/stories");
  revalidatePath("/faith-and-reflections");
}
