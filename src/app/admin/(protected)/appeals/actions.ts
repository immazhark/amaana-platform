"use server";

import { AppealCategory, AppealStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAppealConsentContentIssues, getFirstPublicationIssues, goalMatchesApprovedPublicTarget } from "@/lib/appeal-publication";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  await prisma.$transaction([prisma.appeal.update({ where: { id }, data: { status: next, reviewedById: approvalTransition ? user.id : current.reviewedById, publishedAt: next === "PUBLISHED" && !current.publishedAt ? new Date() : current.publishedAt } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.status_changed", entityType: "Appeal", entityId: id, metadata: { from: current.status, to: next } } })]);
  revalidatePath(`/admin/appeals/${id}`); revalidatePath("/admin/appeals"); revalidatePath("/appeals"); revalidatePath("/");
}

export async function updateFeaturing(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const id = String(formData.get("id")); const isFeatured = formData.get("isFeatured") === "on"; const featuredOrderValue = Number(formData.get("featuredOrder"));
  await prisma.$transaction([prisma.appeal.update({ where: { id }, data: { isFeatured, featuredOrder: isFeatured && Number.isInteger(featuredOrderValue) ? featuredOrderValue : null } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.featuring_updated", entityType: "Appeal", entityId: id, metadata: { isFeatured } } })]);
  revalidatePath(`/admin/appeals/${id}`); revalidatePath("/appeals"); revalidatePath("/");
}

export async function addAppealUpdate(formData: FormData) {
  const user = await requirePermission("appeal.update"); const appealId = String(formData.get("id")); const title = String(formData.get("updateTitle") ?? "").trim(); const content = String(formData.get("updateContent") ?? "").trim(); const requestedPublic = formData.get("isPublic") === "on";
  if (title.length < 5 || content.length < 20) throw new Error("Update title and content are required");
  const isPublic = requestedPublic && hasPermission(user, "appeal.approve");
  const update = await prisma.appealUpdate.create({ data: { appealId, authorId: user.id, title, content, isPublic, publishedAt: isPublic ? new Date() : null } });
  await prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_added", entityType: "Appeal", entityId: appealId, metadata: { updateId: update.id, isPublic } } });
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals");
}

export async function publishAppealUpdate(formData: FormData) {
  const user = await requirePermission("appeal.approve"); const appealId = String(formData.get("appealId")); const updateId = String(formData.get("updateId"));
  await prisma.$transaction([prisma.appealUpdate.update({ where: { id: updateId, appealId }, data: { isPublic: true, publishedAt: new Date() } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "appeal.update_published", entityType: "Appeal", entityId: appealId, metadata: { updateId } } })]);
  revalidatePath(`/admin/appeals/${appealId}`); revalidatePath("/appeals");
}
