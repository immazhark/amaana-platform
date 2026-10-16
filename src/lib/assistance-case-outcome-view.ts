import type { Prisma } from "@prisma/client";
import { hasCurrentPrivateOutcomeEvidence } from "./assistance-outcome";

/** The bounded, private assistance-case workboard view. Keep it explicit:
 * don't load applicant identity, private document bodies or bank references
 * through the outcome-observation relation. */
export const assistanceCaseOutcomeSelect = {
  id: true, kind: true, state: true, summary: true,
  deliveryRecordId: true, reportedById: true, reviewedById: true,
  updatedAt: true, createdAt: true, reviewedAt: true,
  disclosure: { select: {
    id: true, copyText: true, consentDocumentId: true,
    state: true, preparedById: true, approvedById: true,
    publishedAt: true, updatedAt: true, approvedAt: true,
    approvedBy: { select: { name: true } },
  } },
  reportedBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
  deliveryRecord: {
    select: {
      kind: true, state: true, reportedById: true, evidenceDocumentId: true,
      financialReconciliation: {
        select: { status: true, bankProofDocumentId: true, submittedById: true },
      },
    },
  },
} satisfies Prisma.AssistanceOutcomeObservationSelect;

export type AssistanceCaseOutcome = Prisma.AssistanceOutcomeObservationGetPayload<{
  select: typeof assistanceCaseOutcomeSelect
}>;

/** This is a PRIVATE UI eligibility hint only. The server action must
 * independently check the latest case status and document ownership inside
 * its transaction; an earlier internal review never implies public consent. */
export function hasAccessiblePrivateOutcomeEvidence(
  delivery: Parameters<typeof hasCurrentPrivateOutcomeEvidence>[0],
  caseDocumentIds: ReadonlySet<string>,
): boolean {
  if (!hasCurrentPrivateOutcomeEvidence(delivery) ||
      !delivery.evidenceDocumentId ||
      !caseDocumentIds.has(delivery.evidenceDocumentId)) return false;
  if (delivery.kind !== "FINANCIAL") return true;
  const bankProofId = delivery.financialReconciliation?.bankProofDocumentId;
  return Boolean(bankProofId && caseDocumentIds.has(bankProofId) &&
    bankProofId !== delivery.evidenceDocumentId);
}
