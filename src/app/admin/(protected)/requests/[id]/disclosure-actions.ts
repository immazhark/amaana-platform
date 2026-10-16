"use server";

import { AssistanceOutcomeDisclosureState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import {
  ANONYMOUS_OUTCOME_COPY, disclosureSourceSelect, eligibleForAnonymousCopy,
  parseDisclosureDecision, parseDisclosureProposal, requiredDisclosureEvidenceIds,
} from "@/lib/assistance-outcome-disclosure";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function finish(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* committed transaction */ }
  redirect(`/admin/requests/${id}`);
}

/** Propose fixed anonymous wording ONLY. The consent document must authorize
 * the exact text; neither proposal nor approval creates a public page/update. */
export async function proposeAnonymousOutcomeCopy(form: FormData) {
  const actor = await requirePermission("assistance.update");
  if (!hasPermission(actor, "assistance.view")) throw new Error("Case-view permission is required.");
  const input = parseDisclosureProposal(form);
  await withSerializableTransactionRetry(async tx => {
    const previous = await tx.assistanceOutcomeDisclosure.findUnique({
      where: { observationId: input.observationId },
      select: { observationId: true, preparedById: true, consentDocumentId: true, copyText: true },
    });
    const observation = await tx.assistanceOutcomeObservation.findUnique({
      where: { id: input.observationId },
      select: disclosureSourceSelect,
    });
    if (!observation || observation.assistanceRequestId !== input.caseId) {
      throw new Error("The observation does not belong to this assistance case.");
    }
    const copyText = ANONYMOUS_OUTCOME_COPY[observation.kind];
    if (previous) {
      if (previous.preparedById !== actor.id || previous.copyText !== copyText ||
          previous.consentDocumentId !== input.consentDocumentId) {
        throw new Error("An anonymous-copy proposal already exists for this observation.");
      }
      return; // safe retry, without duplicating sensitive audit activity
    }
    if (!eligibleForAnonymousCopy(observation)) {
      throw new Error("Only a currently evidenced, independently reviewed STANDARD-confidentiality outcome qualifies.");
    }
    if (observation.updatedAt.getTime() !== input.expectedObservationUpdatedAt.getTime()) {
      throw new Error("The observation changed. Reload before proposing anonymous copy.");
    }
    const supportingIds = requiredDisclosureEvidenceIds(observation, input.consentDocumentId);
    if (new Set(supportingIds).size !== supportingIds.length || supportingIds.length < 2) {
      throw new Error("Exact-copy consent must be separate from underlying delivery or bank evidence.");
    }
    const available = await tx.assistanceDocument.count({
      where: { assistanceRequestId: input.caseId, id: { in: supportingIds } },
    });
    if (available !== supportingIds.length) {
      throw new Error("Consent and supporting evidence must belong to this case and remain available.");
    }
    const record = await tx.assistanceOutcomeDisclosure.create({
      data: {
        observationId: input.observationId, consentDocumentId: input.consentDocumentId,
        copyText, preparedById: actor.id,
      },
      select: { id: true },
    });
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.anonymous_outcome_copy_proposed",
      entityType: "AssistanceRequest", entityId: input.caseId,
      // No applicant narrative or consent document contents in general audit JSON.
      metadata: { disclosureId: record.id, observationId: input.observationId },
    } });
  });
  finish(input.caseId);
}

/** Separate content plus case approval. APPROVED_COPY is NOT PUBLISHED.
 * No public route, impact increment, applicant messaging or payment mutation. */
export async function reviewAnonymousOutcomeCopy(form: FormData) {
  const actor = await requirePermission("content.publish");
  if (!hasPermission(actor, "assistance.view") ||
      !hasPermission(actor, "assistance.approve")) {
    throw new Error("Both case-view and assistance-approval permissions are required.");
  }
  const input = parseDisclosureDecision(form);
  await withSerializableTransactionRetry(async tx => {
    const item = await tx.assistanceOutcomeDisclosure.findUnique({
      where: { id: input.disclosureId },
      select: {
        id: true, state: true, consentDocumentId: true, copyText: true,
        preparedById: true, approvedById: true, approvedAt: true, updatedAt: true,
        observation: { select: disclosureSourceSelect },
      },
    });
    if (!item || item.observation.assistanceRequestId !== input.caseId) {
      throw new Error("This copy proposal does not belong to the assistance case.");
    }
    if (item.state === input.decision) return; // idempotent response retry
    if (item.state === AssistanceOutcomeDisclosureState.WITHDRAWN ||
        (item.state === AssistanceOutcomeDisclosureState.APPROVED_COPY &&
         input.decision !== AssistanceOutcomeDisclosureState.WITHDRAWN)) {
      throw new Error("This anonymous-copy decision is final; create no automatic replacement.");
    }
    if (item.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new Error("Another reviewer changed this copy. Reload before deciding.");
    }
    if (input.decision === AssistanceOutcomeDisclosureState.APPROVED_COPY) {
      const observation = item.observation;
      if (actor.id === item.preparedById || actor.id === observation.reportedById ||
          actor.id === observation.reviewedById) {
        throw new Error("The copy approver must be independent of the preparer and outcome reviewers.");
      }
      if (!eligibleForAnonymousCopy(observation) ||
          item.copyText !== ANONYMOUS_OUTCOME_COPY[observation.kind]) {
        throw new Error("The case, evidence, or approved anonymous wording changed. Approval is blocked.");
      }
      if (!item.consentDocumentId) {
        throw new Error("Separate written consent for this exact anonymous copy is required.");
      }
      const ids = requiredDisclosureEvidenceIds(observation, item.consentDocumentId);
      if (new Set(ids).size !== ids.length || ids.length < 2) {
        throw new Error("Consent must not reuse private delivery or bank evidence.");
      }
      const available = await tx.assistanceDocument.count({
        where: { assistanceRequestId: input.caseId, id: { in: ids } },
      });
      if (available !== ids.length) {
        throw new Error("The exact-copy consent or supporting evidence is missing.");
      }
    }
    const changed = await tx.assistanceOutcomeDisclosure.updateMany({
      where: { id: item.id, state: item.state, updatedAt: input.expectedUpdatedAt },
      data: {
        state: input.decision, approvedById: actor.id, approvedAt: new Date(),
      },
    });
    if (changed.count !== 1) throw new Error("A separate reviewer changed this proposal.");
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.anonymous_outcome_copy_reviewed",
      entityType: "AssistanceRequest", entityId: input.caseId,
      metadata: {
        disclosureId: item.id, previousState: item.state, state: input.decision,
        ...(item.state === AssistanceOutcomeDisclosureState.APPROVED_COPY
          ? { previousApprovedById: item.approvedById,
              previousApprovedAt: item.approvedAt?.toISOString() ?? null } : {}),
      },
    } });
  });
  finish(input.caseId);
}
