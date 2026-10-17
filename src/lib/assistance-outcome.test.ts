import { describe, expect, it } from "vitest";
import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState,
} from "@prisma/client";
import {
  hasCurrentPrivateOutcomeEvidence, parseOutcomeReport, parseOutcomeReview,
  OUTCOME_KIND_LABELS, OUTCOME_REVIEW_LABELS,
} from "./assistance-outcome";

const version = "2026-10-16T08:00:00.000Z";
const submissionId = "afd34b87-03cf-453a-a87a-df31835f8d12";
function form(change: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    id: "case-synthetic", deliveryRecordId: "delivery-synthetic",
    observationId: "outcome-synthetic", submissionId,
    kind: "PARTIAL_SUPPORT", state: "REVIEWED",
    summary: "The specific delivery provided some of the support needed.",
    expectedDeliveryUpdatedAt: version, expectedUpdatedAt: version,
    limitedScopeAttested: "yes", evidenceAttested: "yes", ...change,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
const caseRecord = {
  status: "APPROVED", appealId: null,
  verification: { decision: "APPROVED_PRIVATE" as const, completedAt: new Date(version) },
};
const source = {
  kind: AssistanceDeliveryKind.IN_KIND,
  state: AssistanceDeliveryReviewState.CONFIRMED,
  evidenceDocumentId: "proof-synthetic",
  financialReconciliation: null,
  assistanceRequest: caseRecord,
};

describe("private operational outcome input", () => {
  it("normalizes an evidence-scoped observation without asserting success or publication", () => {
    expect(parseOutcomeReport(form())).toEqual({
      assistanceRequestId: "case-synthetic",
      deliveryRecordId: "delivery-synthetic", submissionId,
      kind: "PARTIAL_SUPPORT",
      summary: "The specific delivery provided some of the support needed.",
      expectedDeliveryUpdatedAt: new Date(version),
    });
  });
  it.each<Record<string, string>>([
    { kind: "MEDICAL_RECOVERY" }, { kind: "PUBLIC_IMPACT" },
    { kind: "BANK_CLEARED" }, { summary: "Too short" },
    { summary: "x".repeat(301) }, { summary: "Contains\u0000unsafe text" },
    { limitedScopeAttested: "" }, { submissionId: "bad" },
    { deliveryRecordId: "../another-case" }, { expectedDeliveryUpdatedAt: "old" },
  ])("rejects an unsupported or unsafe observation (%j)", changes => {
    expect(() => parseOutcomeReport(form(changes))).toThrow();
  });
  it("allows only reviewed or voided internal decisions", () => {
    expect(parseOutcomeReview(form())).toEqual({
      assistanceRequestId: "case-synthetic",
      observationId: "outcome-synthetic", state: "REVIEWED",
      expectedUpdatedAt: new Date(version),
    });
    expect(() => parseOutcomeReview(form({ state: "PUBLISHED" }))).toThrow();
    expect(() => parseOutcomeReview(form({ state: "REVIEWED", evidenceAttested: "" })))
      .toThrow("Review the actual supporting evidence");
    expect(parseOutcomeReview(form({ state: "VOIDED", evidenceAttested: "" })).state)
      .toBe("VOIDED");
  });
  it("supports correction labels without any public-impact state", () => {
    expect(Object.keys(OUTCOME_KIND_LABELS)).toEqual([
      "PARTIAL_SUPPORT", "SPECIFIC_SUPPORT_COMPLETED", "FURTHER_ACTION_REQUIRED",
    ]);
    expect(Object.keys(OUTCOME_REVIEW_LABELS)).toEqual(["REPORTED", "REVIEWED", "VOIDED"]);
  });
});

describe("actual source conditions for an internal outcome", () => {
  it("requires a reviewed, approved and currently evidenced in-kind delivery", () => {
    expect(hasCurrentPrivateOutcomeEvidence(source)).toBe(true);
    expect(hasCurrentPrivateOutcomeEvidence({ ...source, state: AssistanceDeliveryReviewState.REPORTED }))
      .toBe(false);
    expect(hasCurrentPrivateOutcomeEvidence({ ...source, evidenceDocumentId: null })).toBe(false);
    expect(hasCurrentPrivateOutcomeEvidence({
      ...source, assistanceRequest: { ...caseRecord, appealId: "appeal-private" },
    })).toBe(false);
    expect(hasCurrentPrivateOutcomeEvidence({
      ...source, assistanceRequest: { ...caseRecord, status: "REJECTED" },
    })).toBe(false);
  });
  it("blocks bank or financial inferences when bank proof was not independently reviewed", () => {
    const financial = {
      ...source, kind: AssistanceDeliveryKind.FINANCIAL,
      financialReconciliation: {
        status: AssistanceFinancialReconciliationState.PENDING,
        bankProofDocumentId: "bank-proof",
      },
    };
    expect(hasCurrentPrivateOutcomeEvidence(financial)).toBe(false);
    expect(hasCurrentPrivateOutcomeEvidence({
      ...financial,
      financialReconciliation: {
        status: AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED,
        bankProofDocumentId: null,
      },
    })).toBe(false);
    expect(hasCurrentPrivateOutcomeEvidence({
      ...financial,
      financialReconciliation: {
        status: AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED,
        bankProofDocumentId: "bank-proof",
      },
    })).toBe(true);
    expect(hasCurrentPrivateOutcomeEvidence({
      ...financial,
      financialReconciliation: {
        status: AssistanceFinancialReconciliationState.VOIDED,
        bankProofDocumentId: "bank-proof",
      },
    })).toBe(false);
  });
});
