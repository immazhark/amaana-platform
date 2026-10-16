import { describe, expect, it } from "vitest";
import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState, AssistanceOutcomeKind,
  AssistanceOutcomeReviewState,
} from "@prisma/client";
import {
  ANONYMOUS_OUTCOME_COPY, DISCLOSURE_STATUS_LABELS,
  eligibleForAnonymousCopy, parseDisclosureDecision,
  parseDisclosureProposal, requiredDisclosureEvidenceIds,
} from "./assistance-outcome-disclosure";

const version = "2026-10-16T11:20:00.000Z";
function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    id: "case-synthetic", observationId: "outcome-synthetic",
    consentDocumentId: "specific-consent-document",
    exactCopyConsentAttested: "yes", expectedObservationUpdatedAt: version,
    disclosureId: "disclosure-synthetic", decision: "APPROVED_COPY",
    consentReviewAttested: "yes", expectedUpdatedAt: version,
    ...changes,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
const source = {
  id: "outcome-synthetic", assistanceRequestId: "case-synthetic",
  kind: AssistanceOutcomeKind.PARTIAL_SUPPORT,
  state: AssistanceOutcomeReviewState.REVIEWED,
  updatedAt: new Date(version), reportedById: "outcome-reporter", reviewedById: "outcome-reviewer",
  deliveryRecord: {
    kind: AssistanceDeliveryKind.IN_KIND,
    state: AssistanceDeliveryReviewState.CONFIRMED,
    evidenceDocumentId: "delivery-proof",
    financialReconciliation: null,
    assistanceRequest: {
      id: "case-synthetic", status: "APPROVED", appealId: null,
      verification: {
        decision: "APPROVED_PRIVATE" as const,
        completedAt: new Date(version), confidentialityLevel: "STANDARD" as const,
      },
    },
  },
};

describe("explicit anonymous-outcome copy consent", () => {
  it("records a consent proof reference rather than untrusted disclosure text", () => {
    expect(parseDisclosureProposal(form())).toEqual({
      caseId: "case-synthetic",
      observationId: "outcome-synthetic",
      consentDocumentId: "specific-consent-document",
      expectedObservationUpdatedAt: new Date(version),
    });
  });
  it.each([
    { exactCopyConsentAttested: "" },
    { consentDocumentId: "" },
    { consentDocumentId: "../another-case" },
    { expectedObservationUpdatedAt: "stale" },
    { observationId: "<script>alert(1)</script>" },
  ])("rejects malformed or nonconsensual disclosure proposals (%j)", changes => {
    expect(() => parseDisclosureProposal(form(changes))).toThrow();
  });
  it("only accepts internal copy approval or withdrawal, never public publication", () => {
    expect(parseDisclosureDecision(form()).decision).toBe("APPROVED_COPY");
    expect(parseDisclosureDecision(form({ decision: "WITHDRAWN", consentReviewAttested: "" })).decision)
      .toBe("WITHDRAWN");
    expect(() => parseDisclosureDecision(form({ decision: "PUBLISHED" }))).toThrow();
    expect(() => parseDisclosureDecision(form({ consentReviewAttested: "" }))).toThrow();
  });
  it("exposes only fixed, anonymous, nonclinical templates", () => {
    expect(Object.keys(ANONYMOUS_OUTCOME_COPY)).toEqual([
      "PARTIAL_SUPPORT", "SPECIFIC_SUPPORT_COMPLETED", "FURTHER_ACTION_REQUIRED",
    ]);
    for (const wording of Object.values(ANONYMOUS_OUTCOME_COPY)) {
      expect(wording.length).toBeGreaterThanOrEqual(40);
      expect(wording.length).toBeLessThanOrEqual(240);
      expect(wording).not.toMatch(/name|hospital|cancer|patient|INR|₹|account|school|street|date|family/i);
    }
    expect(Object.keys(DISCLOSURE_STATUS_LABELS)).toEqual([
      "DRAFT", "APPROVED_COPY", "WITHDRAWN",
    ]);
  });
});

describe("current private evidence and confidentiality boundary", () => {
  it("does not turn a reviewed operational outcome into automatic consent", () => {
    expect(eligibleForAnonymousCopy(source)).toBe(true);
    expect(eligibleForAnonymousCopy({ ...source, state: AssistanceOutcomeReviewState.REPORTED }))
      .toBe(false);
    expect(eligibleForAnonymousCopy({
      ...source, deliveryRecord: {
        ...source.deliveryRecord,
        assistanceRequest: {
          ...source.deliveryRecord.assistanceRequest,
          verification: { ...source.deliveryRecord.assistanceRequest.verification,
            confidentialityLevel: "CONFIDENTIAL" as const },
        },
      },
    })).toBe(false);
    expect(eligibleForAnonymousCopy({
      ...source, deliveryRecord: {
        ...source.deliveryRecord, evidenceDocumentId: null,
      },
    })).toBe(false);
    expect(eligibleForAnonymousCopy({
      ...source, deliveryRecord: {
        ...source.deliveryRecord,
        assistanceRequest: {
          ...source.deliveryRecord.assistanceRequest, appealId: "appeal-private",
        },
      },
    })).toBe(false);
  });
  it("requires separate financial and consent evidence instead of substituting private notes", () => {
    expect(requiredDisclosureEvidenceIds(source, "specific-consent-document"))
      .toEqual(["delivery-proof", "specific-consent-document"]);
    const finance = {
      ...source,
      deliveryRecord: {
        ...source.deliveryRecord,
        kind: AssistanceDeliveryKind.FINANCIAL,
        financialReconciliation: {
          status: AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED,
          bankProofDocumentId: "bank-proof",
        },
      },
    };
    expect(eligibleForAnonymousCopy(finance)).toBe(true);
    expect(requiredDisclosureEvidenceIds(finance, "specific-consent-document")).toEqual(
      ["delivery-proof", "bank-proof", "specific-consent-document"],
    );
  });
});
