import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState, AssistanceOutcomeKind,
  AssistanceOutcomeReviewState, type AssistanceVerificationDecision,
} from "@prisma/client";
import { canReportPrivateDelivery } from "./assistance-delivery";

export const OUTCOME_SUMMARY_LIMIT = 300;
export const OUTCOME_KIND_LABELS = {
  PARTIAL_SUPPORT: "Partial support documented for this delivery",
  SPECIFIC_SUPPORT_COMPLETED: "Specific supported action completed (not case-wide closure)",
  FURTHER_ACTION_REQUIRED: "Additional action needed after this delivery",
} as const;
export const OUTCOME_REVIEW_LABELS = {
  REPORTED: "Private outcome reported · independent review pending",
  REVIEWED: "Private operational outcome reviewed · not public impact",
  VOIDED: "Outcome observation voided · excluded from active reporting",
} as const;

const idPattern = /^[A-Za-z0-9_-]{3,128}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const strictIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function required(form: FormData, key: string, max: number) {
  const value = form.get(key);
  if (typeof value !== "string" || value.length > max || controls.test(value)) {
    throw new Error(`Invalid ${key}.`);
  }
  return value.trim();
}
function identifier(form: FormData, key: string) {
  const value = required(form, key, 128);
  if (!idPattern.test(value)) throw new Error(`Invalid ${key}.`);
  return value;
}
function version(form: FormData, key: string) {
  const value = required(form, key, 32);
  if (!strictIso.test(value) || Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value) {
    throw new Error("The record changed. Reload before reviewing.");
  }
  return new Date(value);
}

export function parseOutcomeReport(form: FormData) {
  const assistanceRequestId = identifier(form, "id");
  const deliveryRecordId = identifier(form, "deliveryRecordId");
  const submissionId = required(form, "submissionId", 36);
  if (!uuid.test(submissionId)) throw new Error("Reload the form before recording an outcome.");
  const kind = required(form, "kind", 32);
  if (!Object.prototype.hasOwnProperty.call(OUTCOME_KIND_LABELS, kind)) {
    throw new Error("Select an approved operational outcome category.");
  }
  const summary = required(form, "summary", OUTCOME_SUMMARY_LIMIT);
  if (summary.length < 20) {
    throw new Error("Provide at least 20 characters describing the specific delivered support.");
  }
  if (required(form, "limitedScopeAttested", 3) !== "yes") {
    throw new Error("Confirm that this is a private observation, not a clinical or public impact claim.");
  }
  return {
    assistanceRequestId, deliveryRecordId, submissionId,
    kind: kind as AssistanceOutcomeKind, summary,
    expectedDeliveryUpdatedAt: version(form, "expectedDeliveryUpdatedAt"),
  };
}

export function parseOutcomeReview(form: FormData) {
  const assistanceRequestId = identifier(form, "id");
  const observationId = identifier(form, "observationId");
  const state = required(form, "state", 12);
  if (state !== AssistanceOutcomeReviewState.REVIEWED &&
      state !== AssistanceOutcomeReviewState.VOIDED) {
    throw new Error("Invalid outcome review decision.");
  }
  if (state === "REVIEWED" && required(form, "evidenceAttested", 3) !== "yes") {
    throw new Error("Review the actual supporting evidence before confirming this observation.");
  }
  return {
    assistanceRequestId, observationId,
    state: state as "REVIEWED" | "VOIDED",
    expectedUpdatedAt: version(form, "expectedUpdatedAt"),
  };
}

type ReviewedSource = {
  kind: AssistanceDeliveryKind;
  state: AssistanceDeliveryReviewState;
  evidenceDocumentId: string | null;
  financialReconciliation: {
    status: AssistanceFinancialReconciliationState;
    bankProofDocumentId: string | null;
  } | null;
  assistanceRequest: {
    status: string;
    appealId: string | null;
    verification: { decision: AssistanceVerificationDecision; completedAt: Date | null } | null;
  };
};
/** A reviewed financial proof is human corroboration, never live bank settlement. */
export function hasCurrentPrivateOutcomeEvidence(delivery: ReviewedSource): boolean {
  if (!canReportPrivateDelivery(
    delivery.assistanceRequest.status, delivery.assistanceRequest.appealId,
    delivery.assistanceRequest.verification,
  ) || delivery.state !== AssistanceDeliveryReviewState.CONFIRMED ||
      !delivery.evidenceDocumentId) return false;
  if (delivery.kind === AssistanceDeliveryKind.IN_KIND) return true;
  if (delivery.kind !== AssistanceDeliveryKind.FINANCIAL) return false;
  return delivery.financialReconciliation?.status === AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED &&
    Boolean(delivery.financialReconciliation.bankProofDocumentId);
}
