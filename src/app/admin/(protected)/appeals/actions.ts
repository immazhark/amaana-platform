"use server";

import type { AdminActionFeedback } from "../requests/[id]/actions";
import { AppealCategory, AppealStatus } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAppealConsentContentIssues, getFirstPublicationIssues, goalMatchesApprovedPublicTarget } from "@/lib/appeal-publication";
import { getAppealUpdatePublicationIssues } from "@/lib/appeal-update-publication";
import { getAppealCoverMediaIssues } from "@/lib/appeal-cover-media";
import { hasPermission, requirePermission } from "@/lib/auth";
import { parsePositiveRupeeAmount } from "@/lib/amount-entry";
import { prisma } from "@/lib/prisma";
import { normalizeSafePublicMediaUrl } from "@/lib/public-media";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

const transitions: Record<AppealStatus, AppealStatus[]> = {
  DRAFT: ["UNDER_REVIEW"], UNDER_REVIEW: ["DRAFT", "PUBLISHED", "REJECTED"], PUBLISHED: ["PAUSED", "FUNDED", "CLOSED"], PAUSED: ["PUBLISHED", "CLOSED"], FUNDED: ["CLOSED"], CLOSED: [], REJECTED: ["DRAFT"],
};

type AppealCoverDb = Pick<typeof prisma, "mediaAsset" | "auditEvent">;

async function assertApprovedAppealCoverMedia(db: AppealCoverDb, coverImageUrl: string | null) {
  if (!coverImageUrl) return;

  const media = await db.mediaAsset.findFirst({
    where: {
      kind: "IMAGE",
      isPublic: true,
      privacyApprovedAt: { not: null },
      publicUrl: coverImageUrl,
    },
    select: {
      id: true,
      kind: true,
      isPublic: true,
      privacyApprovedAt: true,
      publicUrl: true,
    },
  });

  const review = media
    ? await db.auditEvent.findFirst({
        where: {
          entityType: "MediaAsset",
          entityId: media.id,
          action: "media.privacy_reviewed",
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { metadata: true },
      })
    : null;

  const issues = getAppealCoverMediaIssues(media, review?.metadata);
  if (issues.length) throw new Error(issues.join(" "));
}

export async function updateAppeal(formData: FormData) {
  const user = await requirePermission("appeal.update"); const id = String(formData.get("id"));
  const expectedUpdatedAtRaw = String(formData.get("expectedUpdatedAt") ?? "").trim();
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Appeal edit version is missing or invalid. Refresh before editing.");
  const title = String(formData.get("title") ?? "").trim(); const slug = String(formData.get("slug") ?? "").trim().toLowerCase(); const summary = String(formData.get("summary") ?? "").trim(); const story = String(formData.get("story") ?? "").trim(); const goalAmount = parsePositiveRupeeAmount(String(formData.get("goalAmount") ?? ""), "Appeal goal");
  const category = String(formData.get("category")); const coverImageRaw = String(formData.get("coverImageUrl") || "").trim(); const beneficiaryDisplayName = String(formData.get("beneficiaryDisplayName") || "").trim();
  if (title.length < 8 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || summary.length < 20 || story.length < 40 || !Number.isFinite(goalAmount) || goalAmount <= 0 || !Object.values(AppealCategory).includes(category as AppealCategory)) throw new Error("Complete all required appeal fields");
  const coverImageValue = coverImageRaw ? normalizeSafePublicMediaUrl(coverImageRaw) : null;
  if (coverImageRaw && !coverImageValue) throw new Error("Cover image URL must be a safe HTTPS or root-relative public media URL");
  const current = await prisma.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
  if (!["DRAFT", "UNDER_REVIEW", "REJECTED"].includes(current.status)) throw new Error("Published appeal content cannot be edited in this workflow");
  if (current.assistanceRequest && !goalMatchesApprovedPublicTarget(goalAmount, current.assistanceRequest.verification)) throw new Error("Appeal goal must match the approved public fundraising target");
  const contentIssues = getAppealConsentContentIssues({ verification: current.assistanceRequest?.verification, beneficiaryDisplayName, coverImageUrl: coverImageValue });
  if (contentIssues.length) throw new Error(contentIssues.join(" "));
  await assertApprovedAppealCoverMedia(prisma, coverImageValue);
  await withSerializableTransactionRetry(async tx => {
    const fresh = await tx.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
    if (fresh.status !== current.status || fresh.updatedAt.getTime() !== expectedUpdatedAt.getTime() || !["DRAFT", "UNDER_REVIEW", "REJECTED"].includes(fresh.status)) {
      throw new Error("This appeal changed while you were reviewing it. Refresh before editing content.");
    }
    if (fresh.assistanceRequest && !goalMatchesApprovedPublicTarget(goalAmount, fresh.assistanceRequest.verification)) throw new Error("Appeal goal must match the approved public fundraising target");
    const freshContentIssues = getAppealConsentContentIssues({ verification: fresh.assistanceRequest?.verification, beneficiaryDisplayName, coverImageUrl: coverImageValue });
    if (freshContentIssues.length) throw new Error(freshContentIssues.join(" "));
    await assertApprovedAppealCoverMedia(tx, coverImageValue);
    const updated = await tx.appeal.updateMany({
      where: { id, status: current.status, updatedAt: expectedUpdatedAt },
      data: { title, slug, summary, story, goalAmount, category: category as AppealCategory, beneficiaryDisplayName: beneficiaryDisplayName || null, beneficiaryLocation: String(formData.get("beneficiaryLocation") || "").trim() || null, coverImageUrl: coverImageValue || null },
    });
    if (updated.count !== 1) throw new Error("This appeal changed while you were reviewing it. Refresh before editing content.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.content_updated", entityType: "Appeal", entityId: id } });
  });
  revalidatePath(`/admin/appeals/${id}`);
}

export async function transitionAppeal(formData: FormData) {
  const user = await requirePermission("appeal.update"); const id = String(formData.get("id")); const next = String(formData.get("status")) as AppealStatus;
  const expectedUpdatedAtRaw = String(formData.get("expectedUpdatedAt") ?? "").trim();
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Appeal workflow version is missing or invalid. Refresh before changing status.");
  const current = await prisma.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
  if (!transitions[current.status].includes(next)) throw new Error("Invalid appeal status transition");
  const approvalTransition = ["PUBLISHED", "PAUSED", "FUNDED", "CLOSED", "REJECTED"].includes(next);
  if (approvalTransition && !hasPermission(user, "appeal.approve")) throw new Error("Approval permission is required");
  const publicationIssues = getFirstPublicationIssues({ fromStatus: current.status, toStatus: next, goalAmount: current.goalAmount, verification: current.assistanceRequest?.verification, beneficiaryDisplayName: current.beneficiaryDisplayName, coverImageUrl: current.coverImageUrl });
  if (publicationIssues.length) throw new Error(`Appeal cannot be published: ${publicationIssues.join(" ")}`);
  if (current.status === "UNDER_REVIEW" && next === "PUBLISHED") {
    await assertApprovedAppealCoverMedia(prisma, current.coverImageUrl);
  }
  await withSerializableTransactionRetry(async tx => {
    const fresh = await tx.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
    if (fresh.status !== current.status || fresh.updatedAt.getTime() !== expectedUpdatedAt.getTime()) throw new Error("This appeal changed while you were reviewing it. Refresh before changing status.");
    if (!transitions[fresh.status].includes(next)) throw new Error("Invalid appeal status transition");
    const freshPublicationIssues = getFirstPublicationIssues({ fromStatus: fresh.status, toStatus: next, goalAmount: fresh.goalAmount, verification: fresh.assistanceRequest?.verification, beneficiaryDisplayName: fresh.beneficiaryDisplayName, coverImageUrl: fresh.coverImageUrl });
    if (freshPublicationIssues.length) throw new Error(`Appeal cannot be published: ${freshPublicationIssues.join(" ")}`);
    if (fresh.status === "UNDER_REVIEW" && next === "PUBLISHED") {
      await assertApprovedAppealCoverMedia(tx, fresh.coverImageUrl);
    }
    const updated = await tx.appeal.updateMany({
      where: { id, status: current.status, updatedAt: expectedUpdatedAt },
      data: { status: next, reviewedById: approvalTransition ? user.id : fresh.reviewedById, publishedAt: next === "PUBLISHED" && !fresh.publishedAt ? new Date() : fresh.publishedAt },
    });
    if (updated.count !== 1) throw new Error("This appeal changed while you were reviewing it. Refresh before changing status.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.status_changed", entityType: "Appeal", entityId: id, metadata: { from: fresh.status, to: next } } });
  });
  revalidateTag("appeals", "max"); revalidatePath(`/admin/appeals/${id}`); revalidatePath("/admin/appeals"); revalidatePath("/appeals"); revalidatePath("/");
}

export async function updateFeaturing(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const id = String(formData.get("id")); const isFeatured = formData.get("isFeatured") === "on"; const featuredOrderValue = Number(formData.get("featuredOrder"));
  const expectedUpdatedAtRaw = String(formData.get("expectedUpdatedAt") ?? "").trim();
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Appeal featuring version is missing or invalid. Refresh before saving.");
  const appeal = await prisma.appeal.findUniqueOrThrow({ where: { id }, select: { status: true } });
  if (isFeatured && appeal.status !== "PUBLISHED") throw new Error("Only an actively published appeal can be featured");
  if (isFeatured && (!Number.isInteger(featuredOrderValue) || featuredOrderValue < 1)) throw new Error("Featured display order must be a positive whole number");
  await withSerializableTransactionRetry(async tx => {
    const fresh = await tx.appeal.findUniqueOrThrow({ where: { id }, select: { status: true, isFeatured: true, featuredOrder: true, updatedAt: true } });
    if (fresh.updatedAt.getTime() !== expectedUpdatedAt.getTime()) throw new Error("This appeal changed while you were reviewing it. Refresh before saving featuring.");
    if (isFeatured && fresh.status !== "PUBLISHED") throw new Error("This appeal is no longer actively published. Refresh before featuring it.");
    const claimed = await tx.appeal.updateMany({ where: { id, updatedAt: expectedUpdatedAt }, data: { isFeatured, featuredOrder: isFeatured ? featuredOrderValue : null } });
    if (claimed.count !== 1) throw new Error("This appeal changed while you were reviewing it. Refresh before saving featuring.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.featuring_updated", entityType: "Appeal", entityId: id, metadata: { previousIsFeatured: fresh.isFeatured, previousFeaturedOrder: fresh.featuredOrder, isFeatured, featuredOrder: isFeatured ? featuredOrderValue : null } } });
  });
  revalidateTag("appeals", "max"); revalidatePath(`/admin/appeals/${id}`); revalidatePath("/appeals"); revalidatePath("/");
}

export async function addAppealUpdate(formData: FormData) {
  const user = await requirePermission("appeal.update"); const appealId = String(formData.get("id")); const title = String(formData.get("updateTitle") ?? "").trim(); const content = String(formData.get("updateContent") ?? "").trim(); const requestedPublic = formData.get("isPublic") === "on"; const privacyReviewed = formData.get("privacyReviewed") === "on";
  if (title.length < 5 || content.length < 20) throw new Error("Update title and content are required");
  const isPublic = requestedPublic && hasPermission(user, "appeal.approve");
  const appeal = await prisma.appeal.findUniqueOrThrow({ where: { id: appealId }, select: { slug: true, status: true, assistanceRequest: { select: { id: true, verification: true } } } });
  if (isPublic) {
    const publicationIssues = getAppealUpdatePublicationIssues({ appealStatus: appeal.status, privacyReviewed, hasAssistanceRequest: Boolean(appeal.assistanceRequest), verification: appeal.assistanceRequest?.verification });
    if (publicationIssues.length) throw new Error(`Appeal update cannot be published: ${publicationIssues.join(" ")}`);
  }
  const updateId = crypto.randomUUID();
  await withSerializableTransactionRetry(async tx => {
    const freshAppeal = await tx.appeal.findUniqueOrThrow({ where: { id: appealId }, select: { status: true, assistanceRequest: { select: { id: true, verification: true } } } });
    if (isPublic) {
      const freshIssues = getAppealUpdatePublicationIssues({ appealStatus: freshAppeal.status, privacyReviewed, hasAssistanceRequest: Boolean(freshAppeal.assistanceRequest), verification: freshAppeal.assistanceRequest?.verification });
      if (freshIssues.length) throw new Error(`Appeal update cannot be published: ${freshIssues.join(" ")}`);
    }
    await tx.appealUpdate.create({ data: { id: updateId, appealId, authorId: user.id, title, content, isPublic, publishedAt: isPublic ? new Date() : null } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_added", entityType: "Appeal", entityId: appealId, metadata: { updateId, isPublic, privacyReviewed: isPublic ? privacyReviewed : false } } });
  });
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals");
  if (isPublic) revalidatePath(`/appeals/${appeal.slug}`);
}

export async function publishAppealUpdate(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const appealId = String(formData.get("appealId")); const updateId = String(formData.get("updateId")); const privacyReviewed = formData.get("privacyReviewed") === "on";
  const [appeal, update] = await Promise.all([
    prisma.appeal.findUniqueOrThrow({ where: { id: appealId }, select: { slug: true, status: true, assistanceRequest: { select: { id: true, verification: true } } } }),
    prisma.appealUpdate.findUniqueOrThrow({ where: { id: updateId }, select: { appealId: true, isPublic: true } }),
  ]);
  if (update.appealId !== appealId) throw new Error("Appeal update does not belong to this appeal");
  if (update.isPublic) throw new Error("Appeal update is already public");
  const publicationIssues = getAppealUpdatePublicationIssues({ appealStatus: appeal.status, privacyReviewed, hasAssistanceRequest: Boolean(appeal.assistanceRequest), verification: appeal.assistanceRequest?.verification });
  if (publicationIssues.length) throw new Error(`Appeal update cannot be published: ${publicationIssues.join(" ")}`);
  await withSerializableTransactionRetry(async tx => {
    const freshAppeal = await tx.appeal.findUniqueOrThrow({ where: { id: appealId }, select: { status: true, assistanceRequest: { select: { id: true, verification: true } } } });
    const freshUpdate = await tx.appealUpdate.findUniqueOrThrow({ where: { id: updateId }, select: { appealId: true, isPublic: true } });
    if (freshUpdate.appealId !== appealId) throw new Error("Appeal update does not belong to this appeal");
    if (freshUpdate.isPublic) throw new Error("Appeal update is already public");
    const freshIssues = getAppealUpdatePublicationIssues({ appealStatus: freshAppeal.status, privacyReviewed, hasAssistanceRequest: Boolean(freshAppeal.assistanceRequest), verification: freshAppeal.assistanceRequest?.verification });
    if (freshIssues.length) throw new Error(`Appeal update cannot be published: ${freshIssues.join(" ")}`);
    const claimed = await tx.appealUpdate.updateMany({ where: { id: updateId, appealId, isPublic: false }, data: { isPublic: true, publishedAt: new Date() } });
    if (claimed.count !== 1) throw new Error("Appeal update changed while you were reviewing it. Refresh before publishing.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_published", entityType: "Appeal", entityId: appealId, metadata: { updateId, privacyReviewed: true } } });
  });
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals"); revalidatePath(`/appeals/${appeal.slug}`);
}

export async function unpublishAppealUpdate(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const appealId = String(formData.get("appealId")); const updateId = String(formData.get("updateId"));
  const [appeal, update] = await Promise.all([
    prisma.appeal.findUniqueOrThrow({ where: { id: appealId }, select: { slug: true } }),
    prisma.appealUpdate.findUniqueOrThrow({ where: { id: updateId }, select: { appealId: true, isPublic: true } }),
  ]);
  if (update.appealId !== appealId) throw new Error("Appeal update does not belong to this appeal");
  if (!update.isPublic) throw new Error("Appeal update is already internal");
  await withSerializableTransactionRetry(async tx => {
    const claimed = await tx.appealUpdate.updateMany({ where: { id: updateId, appealId, isPublic: true }, data: { isPublic: false, publishedAt: null } });
    if (claimed.count !== 1) throw new Error("Appeal update changed while you were reviewing it. Refresh before unpublishing.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_unpublished", entityType: "Appeal", entityId: appealId, metadata: { updateId } } });
  });
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals"); revalidatePath(`/appeals/${appeal.slug}`);
}

// Only deterministic form-rule messages may cross the server-action boundary.
const recoverableAppealMessages = [
  "Appeal edit version is missing or invalid. Refresh before editing.",
  "Complete all required appeal fields",
  "Cover image URL must be a safe HTTPS or root-relative public media URL",
  "Published appeal content cannot be edited in this workflow",
  "Appeal goal must match the approved public fundraising target",
  "This appeal changed while you were reviewing it. Refresh before editing content.",
  "Appeal workflow version is missing or invalid. Refresh before changing status.",
  "Invalid appeal status transition",
  "Approval permission is required",
  "This appeal changed while you were reviewing it. Refresh before changing status.",
  "Appeal goal must be a positive rupee amount with no more than two decimal places",
  "Appeal goal must be a positive amount no greater than ₹9,999,999,999.99",
  "A public beneficiary name requires explicit public-name consent.",
  "A beneficiary-related cover image cannot be used when photo/media consent is not allowed.",
  "Appeal goal must match the approved public fundraising target.",
  "Cover image must reference an image from the approved Media review library.",
  "Appeal cover media must be an image.",
  "Appeal cover media must still be public and privacy-approved.",
  "Appeal cover media must have a public delivery URL.",
  "Appeal cover media needs a recorded structured privacy review.",
  "Appeal cover media must have GREEN public-use classification.",
  "Appeal cover media must be approved for website use.",
  "Appeal cover media must have confirmed provenance.",
  "Appeal cover media cannot contain private documents or private data.",
  "Appeal cover media needs recorded child and patient privacy checks.",
  "Identifiable child or patient cover media requires documented publication consent.",
  "Appeal cover media consent does not permit general website use.",
  "Appeal cover media requires explicit Hero use approved review.",
  "Need must be confirmed.",
  "Supporting evidence must be reviewed.",
  "Verified need amount must be recorded.",
  "Approved public target must be recorded.",
  "Approved public target cannot exceed the verified need amount.",
  "Payment destination must be confirmed.",
  "Other funding or duplicate fundraising must be checked.",
  "Verification summary is required.",
  "Verification decision must approve a public appeal.",
  "Public-name consent must be resolved.",
  "Photo/media consent must be resolved, including not applicable when no beneficiary image will be used.",
  "Medical-detail disclosure consent must be resolved, including not applicable where irrelevant.",
  "Institution/hospital naming consent must be resolved, including not applicable where irrelevant.",
  "Public archive consent must be resolved.",
  "Zakat review must be recorded as eligible, not eligible, or not applicable.",
  "Verification must be formally completed.",
  "Verification record is required."
] as const;

function recoverableAppealMessage(error: unknown): string | null {
  if (!(error instanceof Error) || error.message.length > 4000) return null;
  const prefix = "Appeal cannot be published: ";
  let remaining = error.message.startsWith(prefix) ? error.message.slice(prefix.length) : error.message;
  if (!remaining) return null;
  while (remaining) {
    const match = recoverableAppealMessages.find(message => remaining === message || remaining.startsWith(`${message} `));
    if (!match) return null;
    remaining = remaining.slice(match.length).trimStart();
  }
  return error.message || null;
}

export async function updateAppealWithFeedback(
  _previous: AdminActionFeedback, data: FormData,
): Promise<AdminActionFeedback> {
  await requirePermission("appeal.update");
  try {
    await updateAppeal(data);
    return { kind: "success", message: "Appeal content saved." };
  } catch (error) {
    const message = recoverableAppealMessage(error);
    if (message === null) throw error;
    return { kind: "error", message };
  }
}

export async function transitionAppealWithFeedback(
  _previous: AdminActionFeedback, data: FormData,
): Promise<AdminActionFeedback> {
  await requirePermission("appeal.update");
  try {
    await transitionAppeal(data);
    return { kind: "success", message: "Appeal status saved." };
  } catch (error) {
    const message = recoverableAppealMessage(error);
    if (message === null) throw error;
    return { kind: "error", message };
  }
}
