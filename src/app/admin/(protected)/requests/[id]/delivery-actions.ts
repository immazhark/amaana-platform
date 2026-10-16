"use server";

import { AssistanceDeliveryReviewState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { canReportPrivateDelivery, parseDeliveryCreation, parseDeliveryReview } from "@/lib/assistance-delivery";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function returnToCase(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* do not replay committed writes */ }
  redirect(`/admin/requests/${id}`);
}

/** This documents a report of delivery. It does NOT allocate donations,
 * verify a payout or increment a public impact metric. */
export async function reportAssistanceDelivery(form: FormData) {
  const actor = await requirePermission("assistance.update");
  const data = parseDeliveryCreation(form);
  await withSerializableTransactionRetry(async tx => {
    const existing = await tx.assistanceDeliveryRecord.findUnique({
      where: { submissionId: data.submissionId },
      select: {
        assistanceRequestId: true, kind: true, summary: true,
        occurredOn: true, amountInr: true, evidenceDocumentId: true,
      },
    });
    if (existing) {
      if (existing.assistanceRequestId !== data.id ||
          existing.kind !== data.kind || existing.summary !== data.summary ||
          existing.occurredOn.getTime() !== data.occurredOn.getTime() ||
          (existing.amountInr?.toFixed(2) ?? null) !== data.amountInr ||
          existing.evidenceDocumentId !== data.evidenceDocumentId) {
        throw new Error("This delivery submission token belongs to different information. Reload the case.");
      }
      return;
    }
    const request = await tx.assistanceRequest.findUnique({
      where: { id: data.id },
      select: {
        id: true, appealId: true, status: true, updatedAt: true,
        verification: { select: { decision: true, completedAt: true } },
      },
    });
    if (!request || !canReportPrivateDelivery(request.status, request.appealId, request.verification)) {
      throw new Error("Only approved, non-converted cases with completed verification can record delivery.");
    }
    if (request.updatedAt.getTime() !== data.expectedUpdatedAt.getTime()) {
      throw new Error("The case changed during reporting. Reload before recording delivery.");
    }
    if (data.evidenceDocumentId) {
      const proof = await tx.assistanceDocument.findFirst({
        where: { id: data.evidenceDocumentId, assistanceRequestId: data.id },
        select: { id: true },
      });
      if (!proof) throw new Error("The selected evidence document does not belong to this case.");
    }
    const record = await tx.assistanceDeliveryRecord.create({
      data: {
        assistanceRequestId: data.id, submissionId: data.submissionId,
        kind: data.kind, summary: data.summary, occurredOn: data.occurredOn,
        amountInr: data.amountInr, evidenceDocumentId: data.evidenceDocumentId,
        reportedById: actor.id,
      },
      select: { id: true },
    });
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.delivery_reported",
      entityType: "AssistanceRequest", entityId: data.id,
      metadata: { deliveryRecordId: record.id, kind: data.kind, evidenceLinked: Boolean(data.evidenceDocumentId) },
    } });
  });
  returnToCase(data.id);
}

/** Independent private evidence review. Only the explicit CONFIRMED state
 * describes reviewed support; no transfer, impact publishing or status change. */
export async function reviewAssistanceDelivery(form: FormData) {
  const actor = await requirePermission("assistance.approve");
  const { id, recordId, state, expectedUpdatedAt } = parseDeliveryReview(form);
  await withSerializableTransactionRetry(async tx => {
    const record = await tx.assistanceDeliveryRecord.findUnique({
      where: { id: recordId },
      select: {
        assistanceRequestId: true, reportedById: true, state: true,
        evidenceDocumentId: true, updatedAt: true,
      },
    });
    if (!record || record.assistanceRequestId !== id) {
      throw new Error("Delivery report does not belong to this assistance case.");
    }
    if (record.state === state) return; // repeated response cannot duplicate the review
    if (record.state === AssistanceDeliveryReviewState.VOIDED ||
        (record.state === AssistanceDeliveryReviewState.CONFIRMED && state !== "VOIDED")) {
      throw new Error("This delivery report has already reached a final review state.");
    }
    if (record.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("The delivery report changed. Reload before reviewing.");
    }
    if (state === AssistanceDeliveryReviewState.CONFIRMED) {
      if (record.reportedById === actor.id) {
        throw new Error("An independent approver must review evidence reported by another staff member.");
      }
      if (!record.evidenceDocumentId) {
        throw new Error("Attach private evidence to the delivery report before confirming it.");
      }
      const document = await tx.assistanceDocument.findFirst({
        where: { id: record.evidenceDocumentId, assistanceRequestId: id },
        select: { id: true },
      });
      if (!document) throw new Error("Linked supporting evidence is no longer available for review.");
    }
    const changed = await tx.assistanceDeliveryRecord.updateMany({
      where: { id: recordId, assistanceRequestId: id,
        state: record.state, updatedAt: expectedUpdatedAt },
      data: { state, reviewedById: actor.id, reviewedAt: new Date() },
    });
    if (changed.count !== 1) throw new Error("Another reviewer updated this report. Reload the case.");
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.delivery_reviewed",
      entityType: "AssistanceRequest", entityId: id,
      metadata: { deliveryRecordId: recordId, previousState: record.state, state },
    } });
  });
  returnToCase(id);
}
