// Rejecting an assistance request (assistance queue brief, section 6). Pure rules, no database and no clock.
//
// The rejection path is deliberately its own path. It reads exactly two reviewer-entered values, the reason and an
// explicit confirmation, and nothing else from the form: approval evidence, amounts, destinations, disclosure permissions
// and the Zakat review are not prerequisites for declining a request and are never parsed here. A reviewer who is
// declining a case must not be pushed to affirm a need they are declining or have not verified.

/** The documented reason rule: 3 to 2000 characters after trimming, with at least one letter or digit. A concise, genuine
 * reason such as "Duplicate" or "Not eligible" is accepted; an arbitrary long minimum would only invite filler. */
export const REJECTION_REASON_MIN_LENGTH = 3;
export const REJECTION_REASON_MAX_LENGTH = 2000;

export type RejectionFieldErrors = { reason?: string; confirmation?: string };
export type RejectionParse = { ok: true; reason: string } | { ok: false; errors: RejectionFieldErrors };

const MESSAGES = {
  reasonMissing: "Enter the reason for rejecting this request.",
  reasonTooShort: `Explain the reason in at least ${REJECTION_REASON_MIN_LENGTH} characters, using letters or numbers.`,
  reasonTooLong: `Keep the reason to ${REJECTION_REASON_MAX_LENGTH} characters or fewer.`,
  confirmation: "Confirm the rejection to continue.",
} as const;

/**
 * Validates a rejection submission from a bag of form fields, reading only `reason` and `confirmRejection` and ignoring
 * every other key. Every problem is returned together so the reviewer can fix them in one pass. On
 * success the result carries the trimmed reason and nothing else, so no approval value can travel with a rejection.
 */
export function parseRejectionInput(fields: Readonly<Record<string, unknown>>): RejectionParse {
  const errors: RejectionFieldErrors = {};
  const raw = typeof fields.reason === "string" ? fields.reason.trim() : "";
  if (!raw) errors.reason = MESSAGES.reasonMissing;
  else if (raw.length > REJECTION_REASON_MAX_LENGTH) errors.reason = MESSAGES.reasonTooLong;
  else if (raw.length < REJECTION_REASON_MIN_LENGTH || !/[\p{L}\p{N}]/u.test(raw)) errors.reason = MESSAGES.reasonTooShort;
  // The checkbox's own value, exactly. Anything else is not an explicit confirmation.
  if (fields.confirmRejection !== "on") errors.confirmation = MESSAGES.confirmation;
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, reason: raw };
}

export type RejectionEligibility = "eligible" | "already_rejected" | "linked_appeal" | "closed" | "unknown";

/**
 * Whether a request may be rejected from its current state. A request with a linked appeal is managed through that
 * appeal and is never rejected here (the linked-appeal lifecycle is not bypassed); a closed case must be reopened first;
 * a case that is already rejected is recognised so a repeat or a retry is safe.
 */
export function rejectionEligibility(status: string, hasLinkedAppeal: boolean): RejectionEligibility {
  if (hasLinkedAppeal || status === "CONVERTED_TO_APPEAL") return "linked_appeal";
  if (status === "REJECTED") return "already_rejected";
  if (status === "CLOSED") return "closed";
  if (["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"].includes(status)) return "eligible";
  return "unknown";
}
