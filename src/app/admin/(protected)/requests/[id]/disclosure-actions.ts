"use server";

import { AssistanceOutcomeDisclosureState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import {
  ANONYMOUS_OUTCOME_COPY, disclosureSourceSelect, eligibleForAnonymousCopy,
  parseDisclosureDecision, parseDisclosureProposal, parseDisclosurePublication,
  validatedAnonymousDisclosureEvidenceIds,
} from "@/lib/assistance-outcome-disclosure";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { withdrawStaleAnonymousOutcomeCopies } from "@/lib/assistance-outcome-invalidation";

function finish(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* committed transaction */ }
  try { revalidatePath("/impact"); } catch { /* public path dynamically rechecks eligibility */ }
  redirect(`/admin/requests/${id}`);
}

/** Central RBAC for private copy review, explicit publication and remediation.
 * The individual server actions still validate ownership, eligibility and state. */
async function requireAnonymousDisclosureApprover() {
  const actor = await requirePermission("content.approve");
  if (!hasPermission(actor, "assistance.view") ||
      !hasPermission(actor, "assistance.approve")) {
    throw new Error("Case-view and assistance-approval permissions are required.");
  }
  return actor;
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
      select: { observationId: true, preparedById: true, consentDocumentId: true, copyText: true, state: true },
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
      if (previous.state === AssistanceOutcomeDisclosureState.WITHDRAWN) {
        throw new Error("This anonymous-copy consent was withdrawn and cannot be reused.");
      }
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
    const supportingIds = validatedAnonymousDisclosureEvidenceIds(
      observation, copyText, input.consentDocumentId,
    );
    if (!supportingIds) {
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
  const actor = await requireAnonymousDisclosureApprover();
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
    // Only DRAFT -> APPROVED_COPY is allowed. Every active state may
    // transition to WITHDRAWN; no approval action can reopen or downgrade
    // a previously published disclosure.
    if (item.state === AssistanceOutcomeDisclosureState.WITHDRAWN ||
        (input.decision === AssistanceOutcomeDisclosureState.APPROVED_COPY &&
          item.state !== AssistanceOutcomeDisclosureState.DRAFT)) {
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
      const ids = validatedAnonymousDisclosureEvidenceIds(
        observation, item.copyText, item.consentDocumentId,
      );
      if (!ids) {
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
        state: input.decision,
        // Only an actual approval records approver identity. A withdrawn
        // unapproved draft is attributed through its audit event instead.
        ...(input.decision === AssistanceOutcomeDisclosureState.APPROVED_COPY
          ? { approvedById: actor.id, approvedAt: new Date() } : {}),
      },
    });
    if (changed.count !== 1) throw new Error("A separate reviewer changed this proposal.");
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.anonymous_outcome_copy_reviewed",
      entityType: "AssistanceRequest", entityId: input.caseId,
      metadata: {
        disclosureId: item.id, previousState: item.state, state: input.decision,
        ...(input.withdrawalReason ? { withdrawalReason: input.withdrawalReason } : {}),
        ...(item.state === AssistanceOutcomeDisclosureState.APPROVED_COPY
          ? { previousApprovedById: item.approvedById,
              previousApprovedAt: item.approvedAt?.toISOString() ?? null } : {}),
      },
    } });
  });
  finish(input.caseId);
}

/** Explicit, audited publication after separate copy approval. Approval alone
 * can never create a public item. Private records, names and IDs stay private.
 * A different authorized staff member must make this final release decision. */
export async function publishAnonymousOutcomeCopy(form: FormData) {
  const actor = await requireAnonymousDisclosureApprover();
  const input = parseDisclosurePublication(form);
  await withSerializableTransactionRetry(async tx => {
    const item = await tx.assistanceOutcomeDisclosure.findUnique({
      where: { id: input.disclosureId },
      select: {
        id: true, state: true, updatedAt: true, publishedById: true,
        approvedById: true, approvedAt: true, preparedById: true,
        consentDocumentId: true, copyText: true,
        observation: { select: disclosureSourceSelect },
      },
    });
    if (!item || item.observation.assistanceRequestId !== input.caseId) {
      throw new Error("This anonymous copy does not belong to the assistance case.");
    }
    if (item.state === AssistanceOutcomeDisclosureState.PUBLISHED) return;
    if (item.state !== AssistanceOutcomeDisclosureState.APPROVED_COPY ||
        !item.approvedById || !item.approvedAt) {
      throw new Error("Only independently approved anonymous copy can be published.");
    }
    if (item.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new Error("The approved copy changed. Reload before publication.");
    }
    const observation = item.observation;
    if (actor.id === item.approvedById || actor.id === item.preparedById ||
        actor.id === observation.reportedById || actor.id === observation.reviewedById) {
      throw new Error("A different authorized publisher must make the final release decision.");
    }
    if (!eligibleForAnonymousCopy(observation) ||
        item.copyText !== ANONYMOUS_OUTCOME_COPY[observation.kind] ||
        !item.consentDocumentId) {
      throw new Error("Consent, case eligibility or anonymous wording changed; publication is blocked.");
    }
    const ids = validatedAnonymousDisclosureEvidenceIds(
      observation, item.copyText, item.consentDocumentId,
    );
    if (!ids) {
      throw new Error("Explicit consent must remain separate from delivery and bank documents.");
    }
    const available = await tx.assistanceDocument.count({
      where: { assistanceRequestId: input.caseId, id: { in: ids } },
    });
    if (available !== ids.length) {
      throw new Error("Written consent or supporting evidence is missing. Publication is blocked.");
    }
    const changed = await tx.assistanceOutcomeDisclosure.updateMany({
      where: {
        id: item.id, state: AssistanceOutcomeDisclosureState.APPROVED_COPY,
        updatedAt: input.expectedUpdatedAt, publishedAt: null,
      },
      data: {
        state: AssistanceOutcomeDisclosureState.PUBLISHED,
        publishedAt: new Date(), publishedById: actor.id,
      },
    });
    if (changed.count !== 1) {
      throw new Error("The copy changed before publication; reload its approval state.");
    }
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.anonymous_outcome_explicitly_published",
      entityType: "AssistanceRequest", entityId: input.caseId,
      // Never write consent wording, private facts or bank evidence into audit JSON.
      metadata: { disclosureId: item.id, observationId: observation.id },
    } });
  });
  finish(input.caseId);
}

/** Authorized remediation for legacy or externally invalidated records.
 * Recheck live evidence and withdraw only stale copy. Never republish. */
export async function reconcileAnonymousOutcomeDisclosures(form: FormData) {
  const actor = await requireAnonymousDisclosureApprover();
  const value = form.get("id");
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,128}$/.test(value)) {
    throw new Error("Invalid assistance case reference.");
  }
  await withSerializableTransactionRetry(async tx => {
    const request = await tx.assistanceRequest.findUnique({
      where: { id: value }, select: { id: true },
    });
    if (!request) throw new Error("Assistance case not found.");
    await withdrawStaleAnonymousOutcomeCopies(
      tx, value, actor.id, "MANUAL_RECONCILIATION",
    );
  });
  finish(value);
}

/** Emergency privacy takedown: assistance staff can revoke active copy, but
 * cannot approve or publish it. Avoid delays when consent is withdrawn.
 * Both the actor and structured withdrawal reason remain in restricted audit. */
export async function urgentlyWithdrawAnonymousOutcomeCopy(form: FormData) {
  const actor = await requirePermission("assistance.update");
  if (!hasPermission(actor, "assistance.view")) {
    throw new Error("Case-view permission is required to revoke anonymous copy.");
  }
  const input = parseDisclosureDecision(form);
  if (input.decision !== AssistanceOutcomeDisclosureState.WITHDRAWN) {
    throw new Error("Assistance staff can only revoke anonymous copy.");
  }
  await withSerializableTransactionRetry(async tx => {
    const item = await tx.assistanceOutcomeDisclosure.findUnique({
      where: { id: input.disclosureId },
      select: {
        id: true, state: true, updatedAt: true,
        observation: { select: { assistanceRequestId: true } },
      },
    });
    if (!item || item.observation.assistanceRequestId !== input.caseId) {
      throw new Error("This copy does not belong to the assistance case.");
    }
    if (item.state === AssistanceOutcomeDisclosureState.WITHDRAWN) return;
    if (item.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new Error("Anonymous copy changed. Reload before withdrawal.");
    }
    const changed = await tx.assistanceOutcomeDisclosure.updateMany({
      where: {
        id: item.id, state: item.state, updatedAt: input.expectedUpdatedAt,
      },
      data: { state: AssistanceOutcomeDisclosureState.WITHDRAWN },
    });
    if (changed.count !== 1) {
      throw new Error("Another reviewer modified this copy. Reload the case.");
    }
    await tx.auditEvent.create({ data: {
      actorId: actor.id, action: "assistance.anonymous_outcome_urgent_withdrawal",
      entityType: "AssistanceRequest", entityId: input.caseId,
      metadata: {
        disclosureId: item.id, previousState: item.state,
        reason: input.withdrawalReason,
      },
    } });
  });
  finish(input.caseId);
}
