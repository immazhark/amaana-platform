import { describe, expect, it } from "vitest";
import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState,
} from "@prisma/client";
import {
  assistanceCaseOutcomeSelect, hasAccessiblePrivateOutcomeEvidence,
} from "./assistance-case-outcome-view";

const caseContext = {
  status: "APPROVED", appealId: null,
  verification: {
    decision: "APPROVED_PRIVATE" as const,
    completedAt: new Date("2026-10-16T09:00:00.000Z"),
  },
};
const source = {
  kind: AssistanceDeliveryKind.IN_KIND,
  state: AssistanceDeliveryReviewState.CONFIRMED,
  evidenceDocumentId: "proof-one",
  financialReconciliation: null,
  assistanceRequest: caseContext,
};
describe("bounded staff outcome record projection", () => {
  it("never fetches applicant identity, full documents or raw bank references", () => {
    expect(assistanceCaseOutcomeSelect).not.toHaveProperty("assistanceRequest");
    expect(assistanceCaseOutcomeSelect).not.toHaveProperty("applicantName");
    expect(assistanceCaseOutcomeSelect.deliveryRecord.select.financialReconciliation.select)
      .not.toHaveProperty("transactionReference");
    expect(assistanceCaseOutcomeSelect.deliveryRecord.select)
      .not.toHaveProperty("amountInr");
    expect(assistanceCaseOutcomeSelect.disclosure.select)
      .not.toHaveProperty("consentDocument");
  });
  it("requires a currently linked, same-case private delivery evidence ID", () => {
    expect(hasAccessiblePrivateOutcomeEvidence(
      source, new Set(["proof-one"]),
    )).toBe(true);
    expect(hasAccessiblePrivateOutcomeEvidence(
      source, new Set(["unrelated-proof"]),
    )).toBe(false);
    expect(hasAccessiblePrivateOutcomeEvidence(
      { ...source, evidenceDocumentId: null }, new Set(["proof-one"]),
    )).toBe(false);
    expect(hasAccessiblePrivateOutcomeEvidence(
      { ...source, state: AssistanceDeliveryReviewState.VOIDED },
      new Set(["proof-one"]),
    )).toBe(false);
  });
  it("requires both distinct financial delivery and bank documents", () => {
    const financial = {
      ...source,
      kind: AssistanceDeliveryKind.FINANCIAL,
      financialReconciliation: {
        status: AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED,
        bankProofDocumentId: "bank-proof",
      },
    };
    expect(hasAccessiblePrivateOutcomeEvidence(
      financial, new Set(["proof-one", "bank-proof"]),
    )).toBe(true);
    expect(hasAccessiblePrivateOutcomeEvidence(
      financial, new Set(["proof-one"]),
    )).toBe(false);
    expect(hasAccessiblePrivateOutcomeEvidence({
      ...financial, financialReconciliation: {
        ...financial.financialReconciliation, bankProofDocumentId: "proof-one",
      },
    }, new Set(["proof-one"]))).toBe(false);
    expect(hasAccessiblePrivateOutcomeEvidence({
      ...financial, financialReconciliation: {
        ...financial.financialReconciliation,
        status: AssistanceFinancialReconciliationState.VOIDED,
      },
    }, new Set(["proof-one", "bank-proof"]))).toBe(false);
  });
  it("blocks private current-evidence claims after case exit or approval withdrawal", () => {
    expect(hasAccessiblePrivateOutcomeEvidence({
      ...source, assistanceRequest: { ...caseContext, status: "REJECTED" },
    }, new Set(["proof-one"]))).toBe(false);
    expect(hasAccessiblePrivateOutcomeEvidence({
      ...source, assistanceRequest: { ...caseContext, appealId: "appeal-one" },
    }, new Set(["proof-one"]))).toBe(false);
  });
});
