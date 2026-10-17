import { singleFormValue } from "./single-form-value";
import { AssistanceDeliveryKind, AssistanceDeliveryReviewState, AssistanceVerificationDecision } from "@prisma/client";
import { indiaCalendarDay, shiftedCalendarDay } from "./assistance-follow-up";

const idPattern = /^[a-zA-Z0-9_-]{3,128}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const unsafe = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const text = (form: FormData, name: string, limit = 300) => {
  const value = singleFormValue(form, name);
  if (typeof value !== "string" || value.length > limit || unsafe.test(value)) {
    throw new Error(`Invalid ${name}.`);
  }
  return value.trim();
};
const reference = (form: FormData, name: string) => {
  const value = text(form, name, 128);
  if (!idPattern.test(value)) throw new Error(`Invalid ${name}.`);
  return value;
};
const version = (form: FormData, name: string) => {
  const value = text(form, name, 32);
  if (!iso.test(value) || Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString() !== value) throw new Error("Record changed. Reload before continuing.");
  return new Date(value);
};
export const DELIVERY_REPORT_LIMIT = 300;
export const DELIVERY_STATE_LABELS = {
  REPORTED: "Delivery reported · awaiting independent review",
  CONFIRMED: "Delivery evidence previously reviewed · private record",
  VOIDED: "Record voided · excluded from delivery reporting",
} as const;

export function parseDeliveryCreation(form: FormData, today = indiaCalendarDay(new Date())) {
  const id = reference(form, "id");
  const submissionId = text(form, "submissionId", 36);
  if (!uuid.test(submissionId)) throw new Error("Reload the form before recording delivery.");
  const kind = text(form, "kind", 16);
  if (kind !== AssistanceDeliveryKind.FINANCIAL && kind !== AssistanceDeliveryKind.IN_KIND) {
    throw new Error("Select a supported private delivery type.");
  }
  const summary = text(form, "summary", DELIVERY_REPORT_LIMIT);
  if (summary.length < 20) throw new Error("Delivery summary must contain at least 20 characters.");
  const occurredOn = text(form, "occurredOn", 10);
  if (!dayPattern.test(occurredOn)) throw new Error("Enter a valid delivery date.");
  const date = new Date(occurredOn + "T00:00:00.000Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== occurredOn ||
      occurredOn > today || occurredOn < shiftedCalendarDay(today, -1826)) {
    throw new Error("The actual delivery date must not be in the future or more than five years ago.");
  }
  const rawAmount = text(form, "amountInr", 14);
  let amountInr: string | null = null;
  if (kind === AssistanceDeliveryKind.FINANCIAL) {
    if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(rawAmount) ||
        !/[1-9]/.test(rawAmount)) {
      throw new Error("Enter an actual positive INR amount, with up to two decimals.");
    }
    amountInr = Number(rawAmount).toFixed(2);
  } else if (rawAmount) {
    throw new Error("In-kind support is recorded without an invented cash value.");
  }
  const evidenceDocumentId = text(form, "evidenceDocumentId", 128);
  if (evidenceDocumentId && !idPattern.test(evidenceDocumentId)) {
    throw new Error("Invalid private evidence reference.");
  }
  return {
    id, submissionId, kind: kind as AssistanceDeliveryKind,
    summary, occurredOn: date, amountInr, evidenceDocumentId: evidenceDocumentId || null,
    expectedUpdatedAt: version(form, "expectedUpdatedAt"),
  };
}

export function parseDeliveryReview(form: FormData) {
  const id = reference(form, "id");
  const recordId = reference(form, "recordId");
  const state = text(form, "state", 16);
  if (state !== AssistanceDeliveryReviewState.CONFIRMED &&
      state !== AssistanceDeliveryReviewState.VOIDED) {
    throw new Error("Choose an allowed delivery review action.");
  }
  if (state === AssistanceDeliveryReviewState.CONFIRMED &&
      singleFormValue(form, "evidenceAttested") !== "yes") {
    throw new Error("Confirm that you personally reviewed the delivery evidence.");
  }
  return { id, recordId, state: state as "CONFIRMED" | "VOIDED",
    expectedUpdatedAt: version(form, "expectedRecordUpdatedAt") };
}

export function canReportPrivateDelivery(
  status: string, appealId: string | null,
  verification: { decision: AssistanceVerificationDecision; completedAt: Date | null } | null,
) {
  return !appealId && (status === "APPROVED" || status === "CLOSED") &&
    Boolean(verification?.completedAt) &&
    (verification?.decision === "APPROVED_PRIVATE" ||
     verification?.decision === "APPROVED_PARTIAL" ||
     verification?.decision === "APPROVED_PUBLIC");
}
