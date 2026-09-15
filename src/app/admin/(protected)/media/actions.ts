"use server";

import { MediaKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hasPermission, requirePermission } from "@/lib/auth";
import { mediaPublicationIssues, parseMediaPublicationReview } from "@/lib/media-governance";
import { prisma } from "@/lib/prisma";
import { canRenderPublicMedia } from "@/lib/public-media";
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

  const uploaded = file ? await uploadPublicMediaFile(file) : null;

  let asset;
  try {
    asset = await prisma.mediaAsset.create({
      data: {
        kind: inferredKind,
        title: optionalText(formData.get("title"), 160),
        publicUrl: manualUrl ?? uploaded?.publicUrl ?? null,
        storageKey: uploaded?.objectKey ?? null,
        altText,
        caption: optionalText(formData.get("caption"), 1000),
        sourcePath: optionalText(formData.get("sourcePath"), 500) ?? uploaded?.originalName ?? null,
        sourceYear: Number.isInteger(sourceYearRaw) && sourceYearRaw >= 2000 && sourceYearRaw <= 2100 ? sourceYearRaw : null,
        sortOrder: Number.isInteger(sortOrderRaw) ? sortOrderRaw : 0,
        isPublic: false,
        ...target,
      },
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

  await prisma.auditEvent.create({ data: { actorId: user.id, action: "media.created", entityType: "MediaAsset", entityId: asset.id, metadata: { target, uploaded: Boolean(uploaded), hasPublicUrl: Boolean(asset.publicUrl) } } });
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

  await prisma.$transaction([
    prisma.mediaAsset.update({ where: { id }, data: {
      title: optionalText(formData.get("title"), 160), publicUrl, altText,
      caption: optionalText(formData.get("caption"), 1000), sourcePath: optionalText(formData.get("sourcePath"), 500),
      sourceYear: Number.isInteger(sourceYearRaw) && sourceYearRaw >= 2000 && sourceYearRaw <= 2100 ? sourceYearRaw : null,
      sortOrder: Number.isInteger(sortOrderRaw) ? sortOrderRaw : 0,
    } }),
    prisma.auditEvent.create({ data: { actorId: user.id, action: "media.metadata_updated", entityType: "MediaAsset", entityId: id, metadata: { wasPublic: asset.isPublic } } }),
  ]);
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
