import {
  AssistanceOutcomeDisclosureState,
  type Prisma,
} from "@prisma/client";
import {
  anonymousDisclosureEligibilitySelect,
  validatedAnonymousDisclosureEvidenceIds,
} from "./assistance-outcome-disclosure";

export const ANONYMOUS_COPY_INVALIDATION_TRIGGERS = {
  VERIFICATION_CHANGED: "VERIFICATION_CHANGED",
  CASE_CHANGED: "CASE_CHANGED",
  DELIVERY_VOIDED: "DELIVERY_VOIDED",
  FINANCIAL_PROOF_VOIDED: "FINANCIAL_PROOF_VOIDED",
  OUTCOME_VOIDED: "OUTCOME_VOIDED",
  DOCUMENT_DELETION: "DOCUMENT_DELETION",
  MANUAL_RECONCILIATION: "MANUAL_RECONCILIATION",
} as const;

type Trigger = keyof typeof ANONYMOUS_COPY_INVALIDATION_TRIGGERS;

const nonWithdrawn = [
  AssistanceOutcomeDisclosureState.DRAFT,
  AssistanceOutcomeDisclosureState.APPROVED_COPY,
  AssistanceOutcomeDisclosureState.PUBLISHED,
];

/**
 * Transactional source-of-truth privacy invalidation. Run AFTER mutating
 * a case, outcome, financial review or delivery, and BEFORE deleting evidence.
 * The public projection independently fails closed if this function cannot run.
 * No private copy text, document content or identity appears in audit metadata.
 *
 * retiringDocumentId treats evidence as unavailable before object deletion,
 * while its database row still exists during the retention workflow.
 */
export async function withdrawStaleAnonymousOutcomeCopies(
  tx: Prisma.TransactionClient,
  assistanceRequestId: string,
  actorId: string,
  trigger: Trigger,
  retiringDocumentId?: string,
): Promise<number> {
  const disclosures = await tx.assistanceOutcomeDisclosure.findMany({
    where: {
      state: { in: nonWithdrawn },
      observation: { is: { assistanceRequestId } },
    },
    select: {
      id: true, state: true, updatedAt: true,
      copyText: true, consentDocumentId: true,
      observation: { select: anonymousDisclosureEligibilitySelect },
    },
  });
  if (!disclosures.length) return 0;

  // Apply the same eligibility policy as the public projection BEFORE
  // querying private documents. Ineligible rows are handled as withdrawals,
  // without needlessly reading their outdated evidence references.
  const requiredByDisclosure = disclosures.map(disclosure => ({
    disclosure,
    ids: validatedAnonymousDisclosureEvidenceIds(
      disclosure.observation, disclosure.copyText, disclosure.consentDocumentId,
    ),
  }));
  const documentIds = [...new Set(requiredByDisclosure.flatMap(item => item.ids ?? []))];
  const documents = documentIds.length
    ? await tx.assistanceDocument.findMany({
      where: { assistanceRequestId, id: { in: documentIds } },
      select: { id: true },
    })
    : [];
  const available = new Set(documents.map(doc => doc.id));

  let withdrawn = 0;
  for (const { disclosure, ids } of requiredByDisclosure) {
    const invalid = !ids ||
      ids.some(id => id === retiringDocumentId || !available.has(id));
    if (!invalid) continue;

    const changed = await tx.assistanceOutcomeDisclosure.updateMany({
      where: {
        id: disclosure.id, state: disclosure.state, updatedAt: disclosure.updatedAt,
      },
      // Withdrawal is not copy approval. Retain prior approval attribution,
      // but do not fabricate one for drafts that were never reviewed.
      data: { state: AssistanceOutcomeDisclosureState.WITHDRAWN },
    });
    if (changed.count !== 1) {
      throw new Error("The anonymous disclosure changed during privacy invalidation.");
    }
    await tx.auditEvent.create({
      data: {
        actorId, action: "assistance.anonymous_outcome_automatically_withdrawn",
        entityType: "AssistanceRequest", entityId: assistanceRequestId,
        metadata: {
          disclosureId: disclosure.id, previousState: disclosure.state, trigger,
          ...(retiringDocumentId ? { evidenceDeletionPlanned: true } : {}),
        },
      },
    });
    withdrawn += 1;
  }
  return withdrawn;
}
