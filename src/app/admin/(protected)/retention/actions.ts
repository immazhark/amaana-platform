"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retentionDeletionConfirmed } from "@/lib/retention-safety";
import { deletePrivateDocumentObject } from "@/lib/storage";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

const allowedDecisions = new Set(["RETAIN", "PLACE_HOLD", "RELEASE_HOLD", "DELETE"]);

function singleTextField(formData: FormData, name: string): string | null {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`Use a single text ${name} field.`);
  }
  return value ?? null;
}

function requiredText(value: string | null, field: string, max: number) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  if (text.length > max) throw new Error(`${field} is too long`);
  return text;
}

function optionalReviewDate(value: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Invalid review date");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new Error("Invalid review date");
  }
  return date.toISOString();
}

async function latestLegalHoldEvent(documentId: string, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  const event = await db.auditEvent.findFirst({
    where: {
      entityType: "AssistanceRequest",
      action: { in: ["assistance.document_legal_hold_placed", "assistance.document_legal_hold_released"] },
      metadata: { path: ["documentId"], equals: documentId },
    },
    orderBy: { createdAt: "desc" },
    select: { action: true, createdAt: true },
  });
  if (!event) return null;
  const opposingAction = event.action === "assistance.document_legal_hold_placed"
    ? "assistance.document_legal_hold_released"
    : "assistance.document_legal_hold_placed";
  const conflict = await db.auditEvent.findFirst({
    where: {
      entityType: "AssistanceRequest",
      action: opposingAction,
      createdAt: event.createdAt,
      metadata: { path: ["documentId"], equals: documentId },
    },
    select: { id: true },
  });
  if (conflict) {
    throw new Error("Conflicting legal hold events share a timestamp. Stop and reconcile this document before making a retention decision.");
  }
  return event;
}

async function currentLegalHold(documentId: string, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  const event = await latestLegalHoldEvent(documentId, db);
  return event?.action === "assistance.document_legal_hold_placed";
}

async function deletionClaimed(documentId: string, requestId: string, db: Pick<typeof prisma, "auditEvent"> = prisma) {
  const event = await db.auditEvent.findFirst({
    where: {
      entityType: "AssistanceRequest",
      entityId: requestId,
      action: "assistance.document_deletion_started",
      metadata: { path: ["documentId"], equals: documentId },
    },
    select: { id: true },
  });
  return event !== null;
}

function requireUnclaimedDeletion(claimed: boolean) {
  if (claimed) {
    throw new Error("Document deletion is already claimed or in progress. Stop and reconcile the deletion before another retention decision.");
  }
}

export async function reviewDocumentRetention(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  const documentId = String(singleTextField(formData, "documentId") ?? "").trim();
  const decision = String(singleTextField(formData, "decision") ?? "");
  if (!documentId) throw new Error("Document is required");
  if (!allowedDecisions.has(decision)) throw new Error("Invalid retention decision");
  if (!retentionDeletionConfirmed(decision, String(singleTextField(formData, "deleteConfirmation") ?? ""))) {
    throw new Error("Type DELETE to confirm permanent evidence deletion");
  }
  const reason = requiredText(singleTextField(formData, "reason"), "Retention reason", 2000);
  const reviewAfter = optionalReviewDate(singleTextField(formData, "reviewAfter"));
  const expectedHoldAction = String(singleTextField(formData, "expectedHoldAction") ?? "");
  const expectedHoldCreatedAt = String(singleTextField(formData, "expectedHoldCreatedAt") ?? "");
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
      updatedAt: true,
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
        select: { assistanceRequestId: true, objectKey: true, updatedAt: true },
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
      requireUnclaimedDeletion(await deletionClaimed(documentId, document.assistanceRequestId, tx));
      const updated = await tx.assistanceDocument.updateMany({
        where: { id: documentId, objectKey: document.objectKey, updatedAt: freshDocument.updatedAt },
        data: { updatedAt: new Date() },
      });
      if (updated.count !== 1) {
        throw new Error("This evidence record changed while you were reviewing it. Refresh before recording retention.");
      }
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

    // The hold path and deletion claim both update the same document version
    // in a serializable transaction. A committed claim bars later holds before
    // external storage deletion starts, including after an uncertain failure.
    await withSerializableTransactionRetry(async tx => {
      const deletionSnapshot = await tx.assistanceDocument.findUniqueOrThrow({
        where: { id: documentId },
        select: {
          assistanceRequestId: true,
          objectKey: true,
          updatedAt: true,
          assistanceRequest: {
            select: {
              status: true,
              updatedAt: true,
              appeal: { select: { status: true } },
            },
          },
        },
      });
      if (deletionSnapshot.assistanceRequestId !== document.assistanceRequestId ||
          deletionSnapshot.objectKey !== document.objectKey ||
          deletionSnapshot.updatedAt.getTime() !== document.updatedAt.getTime()) {
        throw new Error("This evidence record changed while you were reviewing it. Refresh before deleting.");
      }
      if (await currentLegalHold(documentId, tx)) {
        throw new Error("This document was placed under hold while you were reviewing it. Refresh before deleting.");
      }
      requireUnclaimedDeletion(await deletionClaimed(documentId, document.assistanceRequestId, tx));
      const stillTerminal = ["CLOSED", "REJECTED"].includes(deletionSnapshot.assistanceRequest.status);
      const stillClosedLinkedAppeal = deletionSnapshot.assistanceRequest.appeal?.status === "CLOSED";
      if (!stillTerminal && !stillClosedLinkedAppeal) {
        throw new Error("The request or linked appeal changed while you were reviewing it. Refresh before deleting.");
      }

      const claimed = await tx.assistanceDocument.updateMany({
        where: { id: documentId, objectKey: document.objectKey, updatedAt: deletionSnapshot.updatedAt },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new Error("This evidence record changed while you were reviewing it. Refresh before deleting.");
      }

      // Status changes update this same request row. Serializable write
      // conflicts make the winner visible before either path can commit.
      const requestClaim = await tx.assistanceRequest.updateMany({
        where: {
          id: document.assistanceRequestId,
          status: deletionSnapshot.assistanceRequest.status,
          updatedAt: deletionSnapshot.assistanceRequest.updatedAt,
        },
        data: { updatedAt: new Date() },
      });
      if (requestClaim.count !== 1) {
        throw new Error("The request changed while you were reviewing it. Refresh before deleting.");
      }

      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "assistance.document_deletion_started",
          entityType: "AssistanceRequest",
          entityId: document.assistanceRequestId,
          metadata: { documentId, reason },
        },
      });
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
