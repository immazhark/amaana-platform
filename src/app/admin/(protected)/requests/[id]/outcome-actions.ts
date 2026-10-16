"use server";

import { AssistanceOutcomeReviewState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import {
  hasCurrentPrivateOutcomeEvidence, parseOutcomeReport, parseOutcomeReview,
} from "@/lib/assistance-outcome";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function returnToCase(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* writes already committed */ }
  try { revalidatePath("/admin"); } catch { /* do not replay successful actions */ }
  redirect(`/admin/requests/${id}`);
}

const activeStates = [
  AssistanceOutcomeReviewState.REPORTED,
  AssistanceOutcomeReviewState.REVIEWED,
];

/** Records a restricted observation about ONE reviewed delivery. This does not
 * close the assistance case, publish any text, or increment impact metrics. */
export async function reportAssistanceOutcome(form: FormData) {
  const actor = await requirePermission("assistance.update");
  if (!hasPermission(actor, "assistance.view")) {
    throw new Error("Case-view permission is required.");
  }
  const input = parseOutcomeReport(form);
  await withSerializableTransactionRetry(async tx => {
    const previouslySubmitted = await tx.assistanceOutcomeObservation.findUnique({
      where: { submissionId: input.submissionId },
      select: {
        assistanceRequestId: true, deliveryRecordId: true, kind: true,
        summary: true, reportedById: true,
      },
    });
    if (previouslySubmitted) {
      if (previouslySubmitted.assistanceRequestId !== input.assistanceRequestId ||
          previouslySubmitted.deliveryRecordId !== input.deliveryRecordId ||
          previouslySubmitted.kind !== input.kind ||
          previouslySubmitted.summary !== input.summary ||
          previouslySubmitted.reportedById !== actor.id) {
        throw new Error("The submission token was already used for another observation.");
      }
      return; // after a lost response, do not append a duplicate audit
    }
    const delivery = await tx.assistanceDeliveryRecord.findUnique({
      where: { id: input.deliveryRecordId },
      select: {
        assistanceRequestId: true, kind: true, state: true, updatedAt: true,
        evidenceDocumentId: true,
        financialReconciliation: { select: { status: true, bankProofDocumentId: true } },
        assistanceRequest: {
          select: {
            status: true, appealId: true,
            verification: { select: { decision: true, completedAt: true } },
          },
        },
      },
    });
    if (!delivery || delivery.assistanceRequestId !== input.assistanceRequestId ||
        !hasCurrentPrivateOutcomeEvidence(delivery)) {
      throw new Error("A current, independently reviewed delivery with complete private evidence is required.");
    }
    if (delivery.updatedAt.getTime() !== input.expectedDeliveryUpdatedAt.getTime()) {
      throw new Error("The delivery changed while preparing the outcome. Reload the case.");
    }
    const evidence = [
      delivery.evidenceDocumentId,
      ...(delivery.kind === "FINANCIAL" ? [delivery.financialReconciliation?.bankProofDocumentId] : []),
    ].filter((id): id is string => typeof id === "string");
    const available = await tx.assistanceDocument.count({
      where: { assistanceRequestId: input.assistanceRequestId, id: { in: evidence } },
    });
    if (available !== evidence.length) {
      throw new Error("Supporting documents were changed or deleted. The observation cannot be recorded.");
    }
    const active = await tx.assistanceOutcomeObservation.findFirst({
      where: { deliveryRecordId: input.deliveryRecordId, state: { in: activeStates } },
      select: { id: true },
    });
    if (active) throw new Error("This delivery already has an active outcome observation.");

    const record = await tx.assistanceOutcomeObservation.create({
      data: {
        assistanceRequestId: input.assistanceRequestId,
        deliveryRecordId: input.deliveryRecordId,
        submissionId: input.submissionId, kind: input.kind, summary: input.summary,
        reportedById: actor.id,
      },
      select: { id: true },
    });
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.outcome_observation_reported",
      entityType: "AssistanceRequest", entityId: input.assistanceRequestId,
      // The narrative and case evidence never enter generalized audit metadata.
      metadata: { observationId: record.id, deliveryRecordId: input.deliveryRecordId,
        kind: input.kind },
    } });
  });
  returnToCase(input.assistanceRequestId);
}

/** A second reviewer must personally examine the source. A REVIEWED outcome
 * remains an INTERNAL observation; it is never publication consent. */
export async function reviewAssistanceOutcome(form: FormData) {
  const actor = await requirePermission("assistance.approve");
  if (!hasPermission(actor, "assistance.view")) {
    throw new Error("Case-view permission is required.");
  }
  const input = parseOutcomeReview(form);
  await withSerializableTransactionRetry(async tx => {
    const item = await tx.assistanceOutcomeObservation.findUnique({
      where: { id: input.observationId },
      select: {
        id: true, assistanceRequestId: true, reportedById: true, state: true,
        reviewedById: true, reviewedAt: true, updatedAt: true,
        deliveryRecord: {
          select: {
            kind: true, state: true, reportedById: true,
            evidenceDocumentId: true,
            financialReconciliation: {
              select: { status: true, bankProofDocumentId: true, submittedById: true },
            },
            assistanceRequest: {
              select: {
                status: true, appealId: true,
                verification: { select: { decision: true, completedAt: true } },
              },
            },
          },
        },
      },
    });
    if (!item || item.assistanceRequestId !== input.assistanceRequestId) {
      throw new Error("This observation does not belong to the assistance case.");
    }
    if (item.state === input.state) return; // idempotent retry of same resolution
    if (item.state === AssistanceOutcomeReviewState.VOIDED ||
        (item.state === AssistanceOutcomeReviewState.REVIEWED &&
         input.state !== AssistanceOutcomeReviewState.VOIDED)) {
      throw new Error("This outcome observation has already reached a final review state.");
    }
    if (item.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new Error("Another reviewer changed this observation. Reload before reviewing.");
    }
    if (input.state === AssistanceOutcomeReviewState.REVIEWED) {
      const delivery = item.deliveryRecord;
      if (actor.id === item.reportedById || actor.id === delivery.reportedById ||
          actor.id === delivery.financialReconciliation?.submittedById) {
        throw new Error("An independent case reviewer must evaluate this observation.");
      }
      if (!hasCurrentPrivateOutcomeEvidence(delivery)) {
        throw new Error("The underlying delivery or bank evidence is no longer eligible for review.");
      }
      const evidence = [
        delivery.evidenceDocumentId,
        ...(delivery.kind === "FINANCIAL" ? [delivery.financialReconciliation?.bankProofDocumentId] : []),
      ].filter((id): id is string => typeof id === "string");
      const available = await tx.assistanceDocument.count({
        where: { assistanceRequestId: input.assistanceRequestId, id: { in: evidence } },
      });
      if (available !== evidence.length) {
        throw new Error("One or more linked private evidence documents are no longer available.");
      }
    }
    const changed = await tx.assistanceOutcomeObservation.updateMany({
      where: { id: input.observationId, assistanceRequestId: input.assistanceRequestId,
        state: item.state, updatedAt: input.expectedUpdatedAt },
      data: { state: input.state, reviewedById: actor.id, reviewedAt: new Date() },
    });
    if (changed.count !== 1) {
      throw new Error("Another reviewer changed this observation. Reload before reviewing.");
    }
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.outcome_observation_reviewed",
      entityType: "AssistanceRequest", entityId: input.assistanceRequestId,
      metadata: {
        observationId: input.observationId,
        previousState: item.state, state: input.state,
        ...(item.state === AssistanceOutcomeReviewState.REVIEWED
          ? { previousReviewedById: item.reviewedById,
              previousReviewedAt: item.reviewedAt?.toISOString() ?? null } : {}),
      },
    } });
  });
  returnToCase(input.assistanceRequestId);
}
