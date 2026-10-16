"use server";

import { AssistanceDeliveryKind, AssistanceDeliveryReviewState, AssistanceFinancialReconciliationState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import { canReportPrivateDelivery } from "@/lib/assistance-delivery";
import {
  parseFinancialCorroboration, parseFinancialCorroborationReview,
} from "@/lib/assistance-financial-reconciliation";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function backToCase(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* transaction was committed */ }
  try { revalidatePath("/admin"); } catch { /* refresh will load committed record */ }
  redirect(`/admin/requests/${id}`);
}

/** This is only a corroboration proposal for an existing confirmed financial
 * delivery. There is NO new payment, allocation, transfer or donor-ledger entry. */
export async function proposeAssistanceFinancialCorroboration(form: FormData) {
  const actor = await requirePermission("assistance.update");
  if (!hasPermission(actor, "assistance.view")) throw new Error("Case-view permission required.");
  const input = parseFinancialCorroboration(form);
  await withSerializableTransactionRetry(async tx => {
    const previous = await tx.assistanceFinancialReconciliation.findUnique({
      where: { deliveryRecordId: input.deliveryRecordId },
      select: { id: true, submittedById: true,
        transactionReference: true, bankProofDocumentId: true },
    });
    if (previous) {
      if (previous.submittedById !== actor.id ||
          previous.transactionReference !== input.transactionReference ||
          previous.bankProofDocumentId !== input.bankProofDocumentId) {
        throw new Error("This delivery already has a different private reconciliation. Request a review.");
      }
      return; // safe replay after a lost response, no new financial event
    }
    const referenceInUse = await tx.assistanceFinancialReconciliation.findUnique({
      where: { transactionReference: input.transactionReference },
      select: { id: true },
    });
    if (referenceInUse) {
      throw new Error("This external transaction reference is already linked to another delivery.");
    }
    const delivery = await tx.assistanceDeliveryRecord.findUnique({
      where: { id: input.deliveryRecordId },
      select: {
        assistanceRequestId: true, kind: true, state: true,
        amountInr: true, updatedAt: true, evidenceDocumentId: true,
        assistanceRequest: {
          select: { status: true, appealId: true,
            verification: { select: { decision: true, completedAt: true } } },
        },
      },
    });
    if (!delivery || delivery.assistanceRequestId !== input.assistanceRequestId ||
        delivery.kind !== AssistanceDeliveryKind.FINANCIAL ||
        delivery.state !== AssistanceDeliveryReviewState.CONFIRMED ||
        !delivery.amountInr ||
        !canReportPrivateDelivery(delivery.assistanceRequest.status,
          delivery.assistanceRequest.appealId, delivery.assistanceRequest.verification)) {
      throw new Error("Only a currently approved, independently reviewed financial delivery can be corroborated.");
    }
    if (delivery.updatedAt.getTime() !== input.expectedDeliveryUpdatedAt.getTime()) {
      throw new Error("The delivery changed during financial reconciliation. Reload.");
    }
    if (delivery.amountInr.toFixed(2) !== input.matchedAmountInr) {
      throw new Error("The stated bank amount does not match the confirmed financial delivery amount.");
    }
    if (delivery.evidenceDocumentId === input.bankProofDocumentId) {
      throw new Error("Bank transaction proof must be separate from delivery-of-support evidence.");
    }
    const bankProof = await tx.assistanceDocument.findFirst({
      where: { id: input.bankProofDocumentId,
        assistanceRequestId: input.assistanceRequestId },
      select: { id: true },
    });
    if (!bankProof) throw new Error("Bank proof must belong to the same private assistance case.");

    const record = await tx.assistanceFinancialReconciliation.create({
      data: {
        deliveryRecordId: input.deliveryRecordId,
        transactionReference: input.transactionReference,
        bankProofDocumentId: input.bankProofDocumentId,
        submittedById: actor.id,
      },
      select: { id: true },
    });
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.financial_corroboration_proposed",
      entityType: "AssistanceRequest", entityId: input.assistanceRequestId,
      // Never copy raw bank reference, paid amount or sensitive proof into audit JSON.
      metadata: { reconciliationId: record.id, deliveryRecordId: input.deliveryRecordId },
    } });
  });
  backToCase(input.assistanceRequestId);
}

/** Human corroboration of a bank-proof document—not live bank confirmation.
 * Independence is enforced against both the corroboration maker and the
 * staff member who reported the original delivery. */
export async function reviewAssistanceFinancialCorroboration(form: FormData) {
  const actor = await requirePermission("donation.reconcile");
  if (!hasPermission(actor, "assistance.view")) throw new Error("Case-view permission required.");
  const input = parseFinancialCorroborationReview(form);
  await withSerializableTransactionRetry(async tx => {
    const item = await tx.assistanceFinancialReconciliation.findUnique({
      where: { id: input.reconciliationId },
      select: {
        id: true, status: true, submittedById: true, reviewedById: true,
        reviewedAt: true, updatedAt: true, bankProofDocumentId: true,
        deliveryRecord: {
          select: { assistanceRequestId: true, state: true, kind: true,
            reportedById: true, evidenceDocumentId: true,
            assistanceRequest: {
              select: { status: true, appealId: true,
                verification: { select: { decision: true, completedAt: true } } },
            },
          },
        },
      },
    });
    if (!item || item.deliveryRecord.assistanceRequestId !== input.assistanceRequestId) {
      throw new Error("Financial corroboration does not belong to this assistance case.");
    }
    if (item.status === input.state) return;
    if (item.status === AssistanceFinancialReconciliationState.VOIDED ||
        (item.status === AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED &&
         input.state !== AssistanceFinancialReconciliationState.VOIDED)) {
      throw new Error("Financial corroboration has already reached a final review state.");
    }
    if (item.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new Error("A reviewer changed this financial record. Reload.");
    }
    if (input.state === AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED) {
      const delivery = item.deliveryRecord;
      if (item.submittedById === actor.id || delivery.reportedById === actor.id) {
        throw new Error("Bank proof needs an independent finance reviewer.");
      }
      if (delivery.kind !== AssistanceDeliveryKind.FINANCIAL ||
          delivery.state !== AssistanceDeliveryReviewState.CONFIRMED ||
          !canReportPrivateDelivery(delivery.assistanceRequest.status,
            delivery.assistanceRequest.appealId, delivery.assistanceRequest.verification)) {
        throw new Error("The underlying case or financial delivery is no longer eligible for bank-proof review.");
      }
      if (!delivery.evidenceDocumentId || !item.bankProofDocumentId) {
        throw new Error("Original delivery evidence and bank proof must still be linked.");
      }
      const documents = await tx.assistanceDocument.count({
        where: { assistanceRequestId: input.assistanceRequestId,
          id: { in: [delivery.evidenceDocumentId, item.bankProofDocumentId] } },
      });
      if (documents !== 2) {
        throw new Error("Both private delivery evidence and separate bank proof must remain available.");
      }
    }
    const result = await tx.assistanceFinancialReconciliation.updateMany({
      where: {
        id: item.id, status: item.status, updatedAt: input.expectedUpdatedAt,
      },
      data: { status: input.state, reviewedById: actor.id, reviewedAt: new Date() },
    });
    if (result.count !== 1) throw new Error("Another finance reviewer changed this record.");
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.financial_corroboration_reviewed",
      entityType: "AssistanceRequest", entityId: input.assistanceRequestId,
      metadata: {
        reconciliationId: item.id,
        previousStatus: item.status, status: input.state,
        ...(item.status === AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED
          ? { previousReviewedById: item.reviewedById,
              previousReviewedAt: item.reviewedAt?.toISOString() ?? null } : {}),
      },
    } });
  });
  backToCase(input.assistanceRequestId);
}
