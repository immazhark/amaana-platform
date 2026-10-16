import {
  AssistanceOutcomeDisclosureState,
  type Prisma,
} from "@prisma/client";
import {
  ANONYMOUS_OUTCOME_COPY,
  disclosureSourceSelect,
  eligibleForAnonymousCopy,
  requiredDisclosureEvidenceIds,
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
      observation: { select: disclosureSourceSelect },
    },
  });
  if (!disclosures.length) return 0;

  const requiredByDisclosure = disclosures.map(disclosure => ({
    disclosure,
    evidence: disclosure.consentDocumentId
      ? requiredDisclosureEvidenceIds(disclosure.observation, disclosure.consentDocumentId)
      : [],
  }));
  const documentIds = [...new Set(requiredByDisclosure.flatMap(item => item.evidence))];
  const documents = documentIds.length
    ? await tx.assistanceDocument.findMany({
      where: { assistanceRequestId, id: { in: documentIds } },
      select: { id: true },
    })
    : [];
  const available = new Set(documents.map(doc => doc.id));

  let withdrawn = 0;
  for (const { disclosure, evidence } of requiredByDisclosure) {
    const observation = disclosure.observation;
    const invalid = !disclosure.consentDocumentId ||
      !eligibleForAnonymousCopy(observation) ||
      disclosure.copyText !== ANONYMOUS_OUTCOME_COPY[observation.kind] ||
      evidence.length < 2 ||
      new Set(evidence).size !== evidence.length ||
      evidence.some(id => id === retiringDocumentId || !available.has(id));
    if (!invalid) continue;

    const changed = await tx.assistanceOutcomeDisclosure.updateMany({
      where: {
        id: disclosure.id, state: disclosure.state, updatedAt: disclosure.updatedAt,
      },
      data: {
        state: AssistanceOutcomeDisclosureState.WITHDRAWN,
        ...(disclosure.state === AssistanceOutcomeDisclosureState.DRAFT
          ? { approvedById: actorId, approvedAt: new Date() } : {}),
      },
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
