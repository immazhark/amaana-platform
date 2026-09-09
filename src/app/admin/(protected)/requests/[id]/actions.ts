"use server";

import { AppealCategory, AssistanceStatus, NotificationChannel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = new Set(Object.values(AssistanceStatus));

export async function updateRequest(formData: FormData) {
  const user = await requirePermission("assistance.update");
  const id = String(formData.get("id")); const status = String(formData.get("status")) as AssistanceStatus; const internalNotes = String(formData.get("internalNotes") ?? "").trim();
  if (!statuses.has(status)) throw new Error("Invalid status");
  const previous = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id } });
  if ((status === AssistanceStatus.APPROVED || status === AssistanceStatus.REJECTED) && previous.status !== status && !hasPermission(user, "assistance.approve")) throw new Error("Approval permission is required");
  await prisma.$transaction([
    prisma.assistanceRequest.update({ where: { id }, data: { status, internalNotes: internalNotes || null } }),
    prisma.auditEvent.create({ data: { actorId: user.id, action: "assistance.updated", entityType: "AssistanceRequest", entityId: id, metadata: { previousStatus: previous.status, status } } }),
    ...(previous.status !== status ? [prisma.notification.create({ data: { channel: previous.email ? NotificationChannel.EMAIL : NotificationChannel.SMS, recipient: previous.email ?? previous.phone, templateKey: "assistance-status-updated", subject: previous.email ? "Your Amaana request status was updated" : null, payload: { referenceNumber: previous.referenceNumber, status }, assistanceRequestId: id } })] : []),
  ]);
  revalidatePath(`/admin/requests/${id}`); revalidatePath("/admin");
}

export async function assignRequest(formData: FormData) {
  const user = await requirePermission("assistance.assign"); const id = String(formData.get("id")); const assignedToId = String(formData.get("assignedToId") || "");
  await prisma.$transaction([prisma.assistanceRequest.update({ where: { id }, data: { assignedToId: assignedToId || null } }), prisma.auditEvent.create({ data: { actorId: user.id, action: "assistance.assigned", entityType: "AssistanceRequest", entityId: id, metadata: { assignedToId: assignedToId || null } } })]);
  revalidatePath(`/admin/requests/${id}`); revalidatePath("/admin");
}

export async function convertToAppeal(formData: FormData) {
  const user = await requirePermission("appeal.create"); const id = String(formData.get("id")); const title = String(formData.get("title") ?? "").trim(); const goalAmount = Number(formData.get("goalAmount"));
  if (title.length < 8 || !Number.isFinite(goalAmount) || goalAmount <= 0) throw new Error("A title and positive goal amount are required");
  const request = await prisma.assistanceRequest.findUniqueOrThrow({ where: { id } });
  if (request.status !== "APPROVED" || request.appealId) throw new Error("Only approved, unconverted requests can become appeals");
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${Date.now().toString(36)}`;
  await prisma.$transaction(async tx => {
    const appeal = await tx.appeal.create({ data: { slug, title, summary: request.description.slice(0, 240), story: request.description, category: request.category as AppealCategory, beneficiaryName: request.applicantName, beneficiaryLocation: request.city, goalAmount, createdById: user.id, assistanceRequest: { connect: { id } } } });
    await tx.assistanceRequest.update({ where: { id }, data: { status: "CONVERTED_TO_APPEAL" } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "appeal.created_from_assistance", entityType: "Appeal", entityId: appeal.id, metadata: { assistanceRequestId: id } } });
  });
  redirect(`/admin/requests/${id}`);
}
