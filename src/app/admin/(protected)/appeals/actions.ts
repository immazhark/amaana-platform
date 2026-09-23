"use server";

import { AppealCategory, AppealStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAppealConsentContentIssues, getFirstPublicationIssues, goalMatchesApprovedPublicTarget } from "@/lib/appeal-publication";
import { getAppealUpdatePublicationIssues } from "@/lib/appeal-update-publication";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

const transitions: Record<AppealStatus, AppealStatus[]> = {
  DRAFT: ["UNDER_REVIEW"], UNDER_REVIEW: ["DRAFT", "PUBLISHED", "REJECTED"], PUBLISHED: ["PAUSED", "FUNDED", "CLOSED"], PAUSED: ["PUBLISHED", "CLOSED"], FUNDED: ["CLOSED"], CLOSED: [], REJECTED: ["DRAFT"],
};

export async function updateAppeal(formData: FormData) {
  const user = await requirePermission("appeal.update"); const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim(); const slug = String(formData.get("slug") ?? "").trim().toLowerCase(); const summary = String(formData.get("summary") ?? "").trim(); const story = String(formData.get("story") ?? "").trim(); const goalAmount = Number(formData.get("goalAmount"));
  const category = String(formData.get("category")); const coverImageValue = String(formData.get("coverImageUrl") || "").trim(); const beneficiaryDisplayName = String(formData.get("beneficiaryDisplayName") || "").trim();
  if (title.length < 8 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || summary.length < 20 || story.length < 40 || !Number.isFinite(goalAmount) || goalAmount <= 0 || !Object.values(AppealCategory).includes(category as AppealCategory)) throw new Error("Complete all required appeal fields");
  if (coverImageValue && new URL(coverImageValue).protocol !== "https:") throw new Error("Cover image must use HTTPS");
  const current = await prisma.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
  if (!["DRAFT", "UNDER_REVIEW", "REJECTED"].includes(current.status)) throw new Error("Published appeal content cannot be edited in this workflow");
  if (current.assistanceRequest && !goalMatchesApprovedPublicTarget(goalAmount, current.assistanceRequest.verification)) throw new Error("Appeal goal must match the approved public fundraising target");
  const contentIssues = getAppealConsentContentIssues({ verification: current.assistanceRequest?.verification, beneficiaryDisplayName, coverImageUrl: coverImageValue });
  if (contentIssues.length) throw new Error(contentIssues.join(" "));
  await prisma.$transaction([prisma.appeal.update({ where: { id }, data: { title, slug, summary, story, goalAmount, category: category as AppealCategory, beneficiaryDisplayName: beneficiaryDisplayName || null, beneficiaryLocation: String(formData.get("beneficiaryLocation") || "").trim() || null, coverImageUrl: coverImageValue || null } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.content_updated", entityType: "Appeal", entityId: id } })]);
  revalidatePath(`/admin/appeals/${id}`);
}

export async function transitionAppeal(formData: FormData) {
  const user = await requirePermission("appeal.update"); const id = String(formData.get("id")); const next = String(formData.get("status")) as AppealStatus;
  const current = await prisma.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
  if (!transitions[current.status].includes(next)) throw new Error("Invalid appeal status transition");
  const approvalTransition = ["PUBLISHED", "PAUSED", "FUNDED", "CLOSED", "REJECTED"].includes(next);
  if (approvalTransition && !hasPermission(user, "appeal.approve")) throw new Error("Approval permission is required");
  const publicationIssues = getFirstPublicationIssues({ fromStatus: current.status, toStatus: next, goalAmount: current.goalAmount, verification: current.assistanceRequest?.verification, beneficiaryDisplayName: current.beneficiaryDisplayName, coverImageUrl: current.coverImageUrl });
  if (publicationIssues.length) throw new Error(`Appeal cannot be published: ${publicationIssues.join(" ")}`);
  await withSerializableTransactionRetry(async tx => {
    const fresh = await tx.appeal.findUniqueOrThrow({ where: { id }, include: { assistanceRequest: { include: { verification: true } } } });
    if (fresh.status !== current.status) throw new Error("This appeal changed while you were reviewing it. Refresh before changing status.");
    if (!transitions[fresh.status].includes(next)) throw new Error("Invalid appeal status transition");
    const freshPublicationIssues = getFirstPublicationIssues({ fromStatus: fresh.status, toStatus: next, goalAmount: fresh.goalAmount, verification: fresh.assistanceRequest?.verification, beneficiaryDisplayName: fresh.beneficiaryDisplayName, coverImageUrl: fresh.coverImageUrl });
    if (freshPublicationIssues.length) throw new Error(`Appeal cannot be published: ${freshPublicationIssues.join(" ")}`);
    const updated = await tx.appeal.updateMany({
      where: { id, status: current.status },
      data: { status: next, reviewedById: approvalTransition ? user.id : fresh.reviewedById, publishedAt: next === "PUBLISHED" && !fresh.publishedAt ? new Date() : fresh.publishedAt },
    });
    if (updated.count !== 1) throw new Error("This appeal changed while you were reviewing it. Refresh before changing status.");
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.status_changed", entityType: "Appeal", entityId: id, metadata: { from: fresh.status, to: next } } });
  });
  revalidatePath(`/admin/appeals/${id}`); revalidatePath("/admin/appeals"); revalidatePath("/appeals"); revalidatePath("/");
}

export async function updateFeaturing(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const id = String(formData.get("id")); const isFeatured = formData.get("isFeatured") === "on"; const featuredOrderValue = Number(formData.get("featuredOrder"));
  const appeal = await prisma.appeal.findUniqueOrThrow({ where: { id }, select: { status: true } });
  if (isFeatured && appeal.status !== "PUBLISHED") throw new Error("Only an actively published appeal can be featured");
  if (isFeatured && (!Number.isInteger(featuredOrderValue) || featuredOrderValue < 1)) throw new Error("Featured display order must be a positive whole number");
  await withSerializableTransactionRetry(async tx => {
    const fresh = await tx.appeal.findUniqueOrThrow({ where: { id }, select: { status: true, isFeatured: true, featuredOrder: true } });
    if (isFeatured && fresh.status !== "PUBLISHED") throw new Error("This appeal is no longer actively published. Refresh before featuring it.");
    await tx.appeal.update({ where: { id }, data: { isFeatured, featuredOrder: isFeatured ? featuredOrderValue : null } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.featuring_updated", entityType: "Appeal", entityId: id, metadata: { previousIsFeatured: fresh.isFeatured, previousFeaturedOrder: fresh.featuredOrder, isFeatured, featuredOrder: isFeatured ? featuredOrderValue : null } } });
  });
  revalidatePath(`/admin/appeals/${id}`); revalidatePath("/appeals"); revalidatePath("/");
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
  await prisma.$transaction([
    prisma.appealUpdate.create({ data: { id: updateId, appealId, authorId: user.id, title, content, isPublic, publishedAt: isPublic ? new Date() : null } }),
    prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_added", entityType: "Appeal", entityId: appealId, metadata: { updateId, isPublic, privacyReviewed: isPublic ? privacyReviewed : false } } }),
  ]);
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
  await prisma.$transaction([prisma.appealUpdate.update({ where: { id: updateId }, data: { isPublic: true, publishedAt: new Date() } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_published", entityType: "Appeal", entityId: appealId, metadata: { updateId, privacyReviewed: true } } })]);
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
  await prisma.$transaction([
    prisma.appealUpdate.update({ where: { id: updateId }, data: { isPublic: false, publishedAt: null } }),
    prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_unpublished", entityType: "Appeal", entityId: appealId, metadata: { updateId } } }),
  ]);
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals"); revalidatePath(`/appeals/${appeal.slug}`);
}
