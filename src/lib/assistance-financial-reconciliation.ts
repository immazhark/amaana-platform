import { singleFormValue } from "./single-form-value";
import { AssistanceFinancialReconciliationState } from "@prisma/client";

const privateId = /^[a-zA-Z0-9_-]{3,128}$/;
const bankRef = /^[A-Z0-9/-]{8,64}$/;
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function text(form: FormData, field: string, max: number): string {
  const candidate = singleFormValue(form, field);
  if (typeof candidate !== "string" || candidate.length > max) {
    throw new Error(`Invalid ${field}.`);
  }
  return candidate.trim();
}

function id(form: FormData, field: string): string {
  const value = text(form, field, 128);
  if (!privateId.test(value)) throw new Error(`Invalid ${field}.`);
  return value;
}

function revision(form: FormData, field: string): Date {
  const raw = text(form, field, 32);
  if (!iso.test(raw) || Number.isNaN(Date.parse(raw)) ||
      new Date(raw).toISOString() !== raw) {
    throw new Error("Record changed. Reload before proceeding.");
  }
  return new Date(raw);
}

/** Input amount is an exact two-decimal attestation, NOT a new ledger entry.
 * The transaction compares this to the already-reviewed delivery amount. */
export function parseFinancialCorroboration(form: FormData) {
  const assistanceRequestId = id(form, "id");
  const deliveryRecordId = id(form, "deliveryRecordId");
  const bankProofDocumentId = id(form, "bankProofDocumentId");
  const transactionReference = text(form, "transactionReference", 64).toUpperCase();
  if (!bankRef.test(transactionReference)) {
    throw new Error("Use an 8–64 character bank reference with letters, digits, / or -.");
  }
  const amount = text(form, "amountInr", 16);
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount) ||
      !/[1-9]/.test(amount)) {
    throw new Error("Enter the actual positive delivery amount in INR.");
  }
  if (text(form, "bankEvidenceAttested", 3) !== "yes") {
    throw new Error("Confirm that the selected document is transaction evidence, not a request-of-need document.");
  }
  return {
    assistanceRequestId, deliveryRecordId, bankProofDocumentId,
    transactionReference, matchedAmountInr: Number(amount).toFixed(2),
    expectedDeliveryUpdatedAt: revision(form, "expectedDeliveryUpdatedAt"),
  };
}

export function parseFinancialCorroborationReview(form: FormData) {
  const assistanceRequestId = id(form, "id");
  const reconciliationId = id(form, "reconciliationId");
  const choice = text(form, "state", 18);
  if (choice !== AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED &&
      choice !== AssistanceFinancialReconciliationState.VOIDED) {
    throw new Error("Invalid bank-proof review action.");
  }
  if (choice === AssistanceFinancialReconciliationState.EVIDENCE_REVIEWED &&
      text(form, "bankEvidenceAttested", 3) !== "yes") {
    throw new Error("Review the bank proof and verify the reference and exact INR amount before confirming.");
  }
  return {
    assistanceRequestId, reconciliationId,
    state: choice as "EVIDENCE_REVIEWED" | "VOIDED",
    expectedUpdatedAt: revision(form, "expectedUpdatedAt"),
  };
}

export const FINANCIAL_CORROBORATION_LABELS = {
  PENDING: "Pending independent bank-proof review",
  EVIDENCE_REVIEWED: "Private bank proof reviewed by staff; settlement not bank-integrated",
  VOIDED: "Reconciliation reference voided; no financial claim",
} as const;

/** An external reference is private; the ordinary workboard shows only its suffix. */
export function maskFinancialReference(value: string): string {
  return value.length >= 8 ? `••••${value.slice(-4)}` : "••••";
}
