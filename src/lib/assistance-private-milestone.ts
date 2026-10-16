/** Internal assistance case notes. Never use this audit metadata as public
 * appeal copy, a medical fact, an approval or an applicant notification. */
export const PRIVATE_MILESTONE_ACTION = "assistance.private_milestone_added" as const;

export const PRIVATE_MILESTONE_KINDS = {
  CONTACT_ATTEMPT: "Contact attempt",
  DOCUMENT_FOLLOW_UP: "Document follow-up",
  INSTITUTION_COORDINATION: "Institution coordination",
  ASSISTANCE_FOLLOW_UP: "Assistance follow-up",
  REVIEW_HANDOFF: "Reviewer handoff",
} as const;

export type PrivateMilestoneKind = keyof typeof PRIVATE_MILESTONE_KINDS;
export const PRIVATE_MILESTONE_SUMMARY_MAX = 600;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unsafe = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function parsePrivateMilestoneInput(data: FormData) {
  const id = data.get("id");
  const kind = data.get("kind");
  const summary = data.get("summary");
  const submissionId = data.get("submissionId");
  const updatedAt = data.get("expectedUpdatedAt");
  if (typeof id !== "string" || !id || id.length > 128 || unsafe.test(id)) {
    throw new Error("Invalid case reference.");
  }
  if (typeof kind !== "string" || !Object.hasOwn(PRIVATE_MILESTONE_KINDS, kind)) {
    throw new Error("Choose an approved internal follow-up type.");
  }
  if (typeof summary !== "string") throw new Error("Enter a case follow-up summary.");
  const normalized = summary.trim();
  if (normalized.length < 12 || normalized.length > PRIVATE_MILESTONE_SUMMARY_MAX || unsafe.test(normalized)) {
    throw new Error("Follow-up summary must contain 12–600 safe characters.");
  }
  if (typeof submissionId !== "string" || !uuid.test(submissionId)) {
    throw new Error("Follow-up submission expired. Reload this case.");
  }
  if (typeof updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(updatedAt) ||
      Number.isNaN(Date.parse(updatedAt)) || new Date(updatedAt).toISOString() !== updatedAt) {
    throw new Error("Case version is missing. Reload before posting.");
  }
  return {
    id, kind: kind as PrivateMilestoneKind, summary: normalized,
    submissionId, expectedUpdatedAt: new Date(updatedAt),
  };
}

/** Never project arbitrary historical audit JSON into case-visible text. */
export function readPrivateMilestone(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.kind !== "string" || !Object.hasOwn(PRIVATE_MILESTONE_KINDS, row.kind) ||
      typeof row.summary !== "string" ||
      row.summary.length < 12 || row.summary.length > PRIVATE_MILESTONE_SUMMARY_MAX ||
      unsafe.test(row.summary)) return null;
  return { kind: row.kind as PrivateMilestoneKind, summary: row.summary };
}

export function canAddPrivateMilestone(status: string, appealId: string | null) {
  return !appealId && (status === "SUBMITTED" || status === "DOCUMENTS_REQUESTED" ||
    status === "UNDER_VERIFICATION" || status === "APPROVED");
}

/** A redaction changes private-case visibility only. The original audit
 * event remains restricted and immutable for compliance review. */
export const PRIVATE_MILESTONE_REDACTED_ACTION = "assistance.private_milestone_redacted" as const;

export const PRIVATE_MILESTONE_REDACTION_REASONS = {
  ENTRY_ERROR: "Recorded in error",
  DUPLICATE: "Duplicate entry",
  SENSITIVE_DETAIL: "Contains unnecessary sensitive information",
} as const;

export type PrivateMilestoneRedactionReason = keyof typeof PRIVATE_MILESTONE_REDACTION_REASONS;

export function parsePrivateMilestoneRedaction(form: FormData) {
  const id = form.get("id");
  const targetId = form.get("targetId");
  const reason = form.get("reason");
  if (typeof id !== "string" || !id || id.length > 128 || unsafe.test(id) ||
      typeof targetId !== "string" || !targetId || targetId.length > 128 || unsafe.test(targetId)) {
    throw new Error("The private follow-up reference is invalid.");
  }
  if (typeof reason !== "string" || !Object.hasOwn(PRIVATE_MILESTONE_REDACTION_REASONS, reason)) {
    throw new Error("Choose a valid private follow-up redaction reason.");
  }
  return { id, targetId, reason: reason as PrivateMilestoneRedactionReason };
}

export function readPrivateMilestoneRedaction(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const targetId = (value as Record<string, unknown>).targetId;
  return typeof targetId === "string" && targetId.length > 0 &&
    targetId.length <= 128 && !unsafe.test(targetId) ? targetId : null;
}
