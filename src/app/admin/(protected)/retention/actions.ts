"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retentionDeletionConfirmed } from "@/lib/retention-safety";
import { deletePrivateDocumentObject } from "@/lib/storage";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

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

async function latestLegalHoldEvent(documentId: string, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  return db.auditEvent.findFirst({
    where: {
      entityType: "AssistanceRequest",
      action: { in: ["assistance.document_legal_hold_placed", "assistance.document_legal_hold_released"] },
      metadata: { path: ["documentId"], equals: documentId },
    },
    orderBy: { createdAt: "desc" },
    select: { action: true },
  });
}

async function currentLegalHold(documentId: string, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  const event = await latestLegalHoldEvent(documentId, db);
  return event?.action === "assistance.document_legal_hold_placed";
}

export async function reviewDocumentRetention(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  const documentId = String(formData.get("documentId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!documentId) throw new Error("Document is required");
  if (!allowedDecisions.has(decision)) throw new Error("Invalid retention decision");
  if (!retentionDeletionConfirmed(decision, String(formData.get("deleteConfirmation") ?? ""))) {
    throw new Error("Type DELETE to confirm permanent evidence deletion");
  }
  const reason = requiredText(formData.get("reason"), "Retention reason", 2000);
  const reviewAfter = optionalReviewDate(formData.get("reviewAfter"));
  const expectedHoldAction = String(formData.get("expectedHoldAction") ?? "");
  const expectedHoldCreatedAt = String(formData.get("expectedHoldCreatedAt") ?? "");
  if (["RETAIN", "PLACE_HOLD"].includes(decision) && reviewAfter && new Date(reviewAfter).getTime() <= Date.now()) {
    throw new Error("Next retention review must be scheduled for a future date");
  }

  const document = await prisma.assistanceDocument.findUniqueOrThrow({
    where: { id: documentId },
    select: {
      id: true,
      assistanceRequestId: true,
      objectKey: true,
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

  if (decision === "PLACE_HOLD" || decision === "RELEASE_HOLD" || decision === "RETAIN") {
    await withSerializableTransactionRetry(async tx => {
      const freshDocument = await tx.assistanceDocument.findUniqueOrThrow({
        where: { id: documentId },
        select: { assistanceRequestId: true, objectKey: true },
      });
      if (freshDocument.assistanceRequestId !== document.assistanceRequestId || freshDocument.objectKey !== document.objectKey) {
        throw new Error("This evidence record changed while you were reviewing it. Refresh before recording retention.");
      }
      const latestHold = await latestLegalHoldEvent(documentId, tx);
      const latestAction = latestHold?.action ?? "";
      const latestCreatedAt = latestHold?.createdAt?.toISOString?.() ?? "";
      if (latestAction !== expectedHoldAction || latestCreatedAt !== expectedHoldCreatedAt) {
        throw new Error("The hold state changed while you were reviewing it. Refresh before recording retention.");
      }
      const currentlyHeld = latestAction === "assistance.document_legal_hold_placed";
      if (decision === "PLACE_HOLD" && currentlyHeld) throw new Error("This document is already under legal/audit/safeguarding hold");
      if (decision === "RELEASE_HOLD" && !currentlyHeld) throw new Error("This document is not currently under hold");
      const action = decision === "PLACE_HOLD"
        ? "assistance.document_legal_hold_placed"
        : decision === "RELEASE_HOLD"
          ? "assistance.document_legal_hold_released"
          : "assistance.document_retention_reviewed";
      await tx.auditEvent.create({ data: {
        actorId: user.id,
        action,
        entityType: "AssistanceRequest",
        entityId: document.assistanceRequestId,
        metadata: decision === "RETAIN"
          ? { documentId, decision: "RETAIN", reason, reviewAfter }
          : { documentId, reason, reviewAfter },
      } });
    });
  } else {
    if (held) throw new Error("Release the legal/audit/safeguarding hold before deletion");
    const terminalRequest = ["CLOSED", "REJECTED"].includes(document.assistanceRequest.status);
    const closedLinkedAppeal = document.assistanceRequest.appeal?.status === "CLOSED";
    if (!terminalRequest && !closedLinkedAppeal) {
      throw new Error("Raw evidence can only be deleted after the assistance request is closed/rejected or its linked appeal is closed");
    }

    // Revalidate the destructive preconditions immediately before touching
    // storage. The initial read is only for the operator preview; it must not
    // authorize a later deletion after another admin changes the request/hold.
    const deletionSnapshot = await prisma.assistanceDocument.findUniqueOrThrow({
      where: { id: documentId },
      select: {
        assistanceRequestId: true,
        objectKey: true,
        assistanceRequest: {
          select: {
            status: true,
            appeal: { select: { status: true } },
          },
        },
      },
    });
    if (deletionSnapshot.assistanceRequestId !== document.assistanceRequestId ||
        deletionSnapshot.objectKey !== document.objectKey) {
      throw new Error("This evidence record changed while you were reviewing it. Refresh before deleting.");
    }
    if (await currentLegalHold(documentId)) {
      throw new Error("This document was placed under hold while you were reviewing it. Refresh before deleting.");
    }
    const stillTerminal = ["CLOSED", "REJECTED"].includes(deletionSnapshot.assistanceRequest.status);
    const stillClosedLinkedAppeal = deletionSnapshot.assistanceRequest.appeal?.status === "CLOSED";
    if (!stillTerminal && !stillClosedLinkedAppeal) {
      throw new Error("The request or linked appeal changed while you were reviewing it. Refresh before deleting.");
    }

    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "assistance.document_deletion_started",
        entityType: "AssistanceRequest",
        entityId: document.assistanceRequestId,
        metadata: {
          documentId,
          reason,
        },
      },
    });

    await deletePrivateDocumentObject(document.objectKey, document.assistanceRequestId);
    await prisma.$transaction([
      prisma.assistanceDocument.delete({ where: { id: documentId, objectKey: document.objectKey } }),
      prisma.auditEvent.create({ data: {
        actorId: user.id,
        action: "assistance.document_deleted",
        entityType: "AssistanceRequest",
        entityId: document.assistanceRequestId,
        metadata: {
          documentId,
          reason,
        },
      } }),
    ]);
  }

  revalidatePath("/admin/retention");
  revalidatePath(`/admin/requests/${document.assistanceRequestId}`);
  revalidatePath("/admin");
}
