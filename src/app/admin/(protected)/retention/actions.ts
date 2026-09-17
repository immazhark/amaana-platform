"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retentionDeletionConfirmed } from "@/lib/retention-safety";
import { deletePrivateDocumentObject } from "@/lib/storage";

const allowedDecisions = new Set(["RETAIN", "PLACE_HOLD", "RELEASE_HOLD", "DELETE"]);

function requiredText(value: FormDataEntryValue | null, field: string, max: number) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  if (text.length > max) throw new Error(`${field} is too long`);
  return text;
}

function optionalReviewDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid review date");
  return date.toISOString();
}

async function currentLegalHold(documentId: string) {
  const event = await prisma.auditEvent.findFirst({
    where: {
      entityType: "AssistanceRequest",
      action: { in: ["assistance.document_legal_hold_placed", "assistance.document_legal_hold_released"] },
      metadata: { path: ["documentId"], equals: documentId },
    },
    orderBy: { createdAt: "desc" },
    select: { action: true },
  });
  return event?.action === "assistance.document_legal_hold_placed";
}

export async function reviewDocumentRetention(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  const documentId = String(formData.get("documentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!allowedDecisions.has(decision)) throw new Error("Invalid retention decision");
  if (!retentionDeletionConfirmed(decision, String(formData.get("deleteConfirmation") ?? ""))) {
    throw new Error("Type DELETE to confirm permanent evidence deletion");
  }
  const reason = requiredText(formData.get("reason"), "Retention reason", 2000);
  const reviewAfter = optionalReviewDate(formData.get("reviewAfter"));

  const document = await prisma.assistanceDocument.findUniqueOrThrow({
    where: { id: documentId },
    select: {
      id: true,
      assistanceRequestId: true,
      objectKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      assistanceRequest: {
        select: {
          referenceNumber: true,
          status: true,
          appeal: { select: { status: true } },
        },
      },
    },
  });

  const held = await currentLegalHold(documentId);

  if (decision === "PLACE_HOLD") {
    if (held) throw new Error("This document is already under legal/audit/safeguarding hold");
    await prisma.auditEvent.create({ data: {
      actorId: user.id,
      action: "assistance.document_legal_hold_placed",
      entityType: "AssistanceRequest",
      entityId: document.assistanceRequestId,
      metadata: { documentId, reason, reviewAfter },
    } });
  } else if (decision === "RELEASE_HOLD") {
    if (!held) throw new Error("This document is not currently under hold");
    await prisma.auditEvent.create({ data: {
      actorId: user.id,
      action: "assistance.document_legal_hold_released",
      entityType: "AssistanceRequest",
      entityId: document.assistanceRequestId,
      metadata: { documentId, reason, reviewAfter },
    } });
  } else if (decision === "RETAIN") {
    await prisma.auditEvent.create({ data: {
      actorId: user.id,
      action: "assistance.document_retention_reviewed",
      entityType: "AssistanceRequest",
      entityId: document.assistanceRequestId,
      metadata: { documentId, decision: "RETAIN", reason, reviewAfter },
    } });
  } else {
    if (held) throw new Error("Release the legal/audit/safeguarding hold before deletion");
    const terminalRequest = ["CLOSED", "REJECTED"].includes(document.assistanceRequest.status);
    const closedLinkedAppeal = document.assistanceRequest.appeal?.status === "CLOSED";
    if (!terminalRequest && !closedLinkedAppeal) {
      throw new Error("Raw evidence can only be deleted after the assistance request is closed/rejected or its linked appeal is closed");
    }

    await deletePrivateDocumentObject(document.objectKey, document.assistanceRequestId);
    await prisma.$transaction([
      prisma.assistanceDocument.delete({ where: { id: documentId } }),
      prisma.auditEvent.create({ data: {
        actorId: user.id,
        action: "assistance.document_deleted",
        entityType: "AssistanceRequest",
        entityId: document.assistanceRequestId,
        metadata: {
          documentId,
          originalName: document.originalName,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          reason,
          requestReference: document.assistanceRequest.referenceNumber,
        },
      } }),
    ]);
  }

  revalidatePath("/admin/retention");
  revalidatePath(`/admin/requests/${document.assistanceRequestId}`);
  revalidatePath("/admin");
}
