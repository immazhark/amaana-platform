// Approving an assistance request (assistance queue brief, sections 7, 8 and 9). Pure rules: no database, no clock.
//
// There are three ways to approve, and what each one needs is stated here once. The same rules decide whether an approval
// is accepted and what the reviewer is told before they submit, so there is no second checklist to drift. The public route's
// requirements are held to the publication gate's own wording by a test that compares them.

import { ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH, ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH, ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH } from "./assistance";

export type ApprovalRoute = "APPROVED_PRIVATE" | "APPROVED_PARTIAL" | "APPROVED_PUBLIC";

export const APPROVAL_ROUTES: readonly { value: ApprovalRoute; label: string; meaning: string }[] = [
  {
    value: "APPROVED_PRIVATE", label: "Private assistance",
    meaning: "Assistance is arranged privately. No public appeal is created, and no public title, story, media or archive permission is needed.",
  },
  {
    value: "APPROVED_PARTIAL", label: "Partial support",
    meaning: "Amaana covers part of the need. Partial funding and public visibility are different things: this does not create a public appeal, and none of the public content is needed.",
  },
  {
    value: "APPROVED_PUBLIC", label: "Public fundraising",
    meaning: "A public appeal is prepared for donors after this approval. Approval never publishes it: the appeal still needs its own review and a separate publication decision.",
  },
];

export function parseApprovalRoute(value: unknown): ApprovalRoute | null {
  return APPROVAL_ROUTES.find(route => route.value === value)?.value ?? null;
}

/** What approval is judged on. Consent values are the stored decision names; UNCONFIRMED means the question is unfinished. */
export type ApprovalFields = {
  needConfirmed: boolean;
  evidenceReviewed: boolean;
  otherFundingChecked: boolean;
  verifiedNeedAmount: number | null;
  approvedPublicTarget: number | null;
  paymentDestination: string;
  verificationSummary: string;
  zakatStatus: string;
  publicNameConsent: string;
  photoConsent: string;
  medicalDetailsConsent: string;
  institutionNameConsent: string;
  archiveConsent: string;
};

export type ApprovalFieldName =
  | "decision" | "confirmApproval" | "otherFundingNotes"
  | "needConfirmed" | "evidenceReviewed" | "verifiedNeedAmount" | "paymentDestination" | "otherFundingChecked" | "verificationSummary" | "zakatStatus"
  | "approvedPublicTarget" | "publicNameConsent" | "photoConsent" | "medicalDetailsConsent" | "institutionNameConsent" | "archiveConsent"
  | "approvedPublicTarget_missing" | "approvedPublicTarget_exceeds" | "approvedPublicTarget_notPublic";
export type ApprovalFieldErrors = Partial<Record<ApprovalFieldName | "confirmation", string>>;

export type ApprovalProblem = string;

const CORE: Record<"needConfirmed" | "evidenceReviewed" | "verifiedNeedAmount" | "paymentDestination" | "otherFundingChecked" | "verificationSummary" | "zakatStatus", string> = {
  needConfirmed: "Need must be confirmed.",
  evidenceReviewed: "Supporting evidence must be reviewed.",
  verifiedNeedAmount: "Verified need amount must be recorded.",
  paymentDestination: "Payment destination must be confirmed.",
  otherFundingChecked: "Other funding or duplicate fundraising must be checked.",
  verificationSummary: "Verification summary is required.",
  zakatStatus: "Zakat review must be recorded as eligible, not eligible, or not applicable.",
};

const CONSENT: Record<"publicNameConsent" | "photoConsent" | "medicalDetailsConsent" | "institutionNameConsent" | "archiveConsent", string> = {
  publicNameConsent: "Public-name consent must be resolved.",
  photoConsent: "Photo/media consent must be resolved, including not applicable when no beneficiary image will be used.",
  medicalDetailsConsent: "Medical-detail disclosure consent must be resolved, including not applicable where irrelevant.",
  institutionNameConsent: "Institution/hospital naming consent must be resolved, including not applicable where irrelevant.",
  archiveConsent: "Public archive consent must be resolved.",
};

/**
 * What stops this approval, by field. An empty result means it may proceed. Every problem is reported together so the
 * reviewer can fix them in one pass. Hiding a field never answers it: an unresolved permission is unfinished, not consent.
 */
export function approvalIssues(route: ApprovalRoute, fields: ApprovalFields, options: { confirmed: boolean }): ApprovalFieldErrors {
  const errors: ApprovalFieldErrors = {};
  if (!fields.needConfirmed) errors.needConfirmed = CORE.needConfirmed;
  if (!fields.evidenceReviewed) errors.evidenceReviewed = CORE.evidenceReviewed;
  if (!fields.verifiedNeedAmount || !Number.isFinite(fields.verifiedNeedAmount) || fields.verifiedNeedAmount <= 0) errors.verifiedNeedAmount = CORE.verifiedNeedAmount;
  if (!fields.paymentDestination.trim()) errors.paymentDestination = CORE.paymentDestination;
  if (!fields.otherFundingChecked) errors.otherFundingChecked = CORE.otherFundingChecked;
  if (!fields.verificationSummary.trim()) errors.verificationSummary = CORE.verificationSummary;
  if (fields.zakatStatus === "UNREVIEWED") errors.zakatStatus = CORE.zakatStatus;

  if (route === "APPROVED_PUBLIC") {
    const target = fields.approvedPublicTarget;
    if (!target || !Number.isFinite(target) || target <= 0) errors.approvedPublicTarget_missing = "Approved public target must be recorded.";
    else if (fields.verifiedNeedAmount && target > fields.verifiedNeedAmount) errors.approvedPublicTarget_exceeds = "Approved public target cannot exceed the verified need amount.";
    for (const key of Object.keys(CONSENT) as (keyof typeof CONSENT)[]) {
      if (fields[key] === "UNCONFIRMED") errors[key] = CONSENT[key];
    }
  } else if (fields.approvedPublicTarget) {
    errors.approvedPublicTarget_notPublic = "A public fundraising target can only be stored for an approved public appeal";
  }

  if (!options.confirmed) errors.confirmation = "Confirm the approval to continue.";
  return errors;
}

/** Converts field errors into an array of problem tokens for the redirect notice. */
export function approvalProblemsFrom(errors: ApprovalFieldErrors): string[] {
  return Object.keys(errors);
}

/** Human message for a problem token. For standard field tokens (e.g. "needConfirmed") it uses the CORE/MESSAGES maps.
 * For the special approvalPublicTarget tokens, it returns the explicit message. */
const SPECIAL_MESSAGES: Record<string, string> = {
  route: "Choose how this request is to be supported.",
  verifiedNeedAmount_format: "Enter a positive verified need amount in rupees, with up to two decimal places.",
  approvedPublicTarget_format: "Enter a positive public fundraising target in rupees, with up to two decimal places.",
  paymentDestination_long: `Keep the payment destination to ${ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH} characters or fewer.`,
  verificationSummary_long: `Keep the verification summary to ${ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH} characters or fewer.`,
  otherFundingNotes_long: `Keep the other funding notes to ${ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH} characters or fewer.`,
  approvedPublicTarget_missing: "Approved public target must be recorded.",
  approvedPublicTarget_exceeds: "Approved public target cannot exceed the verified need amount.",
  approvedPublicTarget_notPublic: "A public fundraising target can only be stored for an approved public appeal",
  confirmation: "Confirm the approval to continue.",
};

/** Extracts the field name from a problem token (the part before the first underscore). */
export function approvalProblemField(problem: string): ApprovalFieldName {
  if (problem === "confirmation") return "confirmApproval";
  if (problem === "route") return "decision";
  return problem.split("_")[0] as ApprovalFieldName;
}

/** Returns the human message for a problem token. Unknown tokens fall back to the form error message. */
export function approvalProblemMessage(problem: string): string {
  if (SPECIAL_MESSAGES[problem]) return SPECIAL_MESSAGES[problem];
  const idx = problem.indexOf("_");
  const field = idx >= 0 ? problem.slice(0, idx) : problem;
  // Fallback to the original error message maps for standard fields
  if (CORE[field as keyof typeof CORE]) return CORE[field as keyof typeof CORE];
  if (CONSENT[field as keyof typeof CONSENT]) return CONSENT[field as keyof typeof CONSENT];
  // Unknown or crafted token: never echo it back; use the generic form error instead.
  return APPROVAL_ERROR_MESSAGES.form;
}

// ---- The outcome travels in the address; the private text never does -------------------------------------------
//
// The approval form is plain server-rendered HTML that posts to a server action, so it needs no client JavaScript and
// still works if scripts fail to load. After the action the browser is redirected back to the request with a notice. The
// notice names only the outcome and which fields were wrong. What the reviewer typed is NOT put in the address (addresses
// are logged and shared): on a correctable error it is held in a short-lived, httpOnly, same-site cookie.

export type ApprovalNotice =
  | { kind: "error"; problems: string[]; code: string | null }
  | { kind: "done"; outcome: "approved" | "already_approved"; route: ApprovalRoute | null };

const APPROVAL_ERROR_CODES = ["draft_save_failed", "incomplete", "not_found", "linked_appeal", "rejected", "closed", "not_eligible", "stale_request", "stale_verification", "reopen_forbidden", "forbidden", "form", "version"] as const;

export function approvalRedirect(requestId: string, notice: ApprovalNotice): string {
  const base = `/admin/requests/${encodeURIComponent(requestId)}`;
  if (notice.kind === "done") return `${base}?approve=done&o=${notice.outcome}&r=${notice.route ?? ""}#approve-heading`;
  const query = ["approve=error"];
  if (notice.problems.length) query.push(`e=${encodeURIComponent(notice.problems.join(","))}`);
  if (notice.code) query.push(`code=${notice.code}`);
  return `${base}?${query.join("&")}#approve-errors`;
}

const one = (value: string | string[] | undefined): string | null => (typeof value === "string" ? value : null);

/** Reads a notice back from the address, accepting only values this module writes, so a crafted link cannot put words on the page. */
export function parseApprovalNotice(search: Readonly<Record<string, string | string[] | undefined>>): ApprovalNotice | null {
  const kind = one(search.approve);
  if (kind === "done") return { kind: "done", outcome: one(search.o) === "already_approved" ? "already_approved" : "approved", route: parseApprovalRoute(one(search.r)) };
  if (kind !== "error") return null;
  const listed = (one(search.e) ?? "").split(",").filter((token): token is string => Object.hasOwn(CORE, token) || Object.hasOwn(CONSENT, token) || Object.hasOwn(SPECIAL_MESSAGES, token));
  const code = one(search.code);
  return { kind: "error", problems: listed, code: code && (APPROVAL_ERROR_CODES as readonly string[]).includes(code) ? code : null };
}

/** A draft amount is kept for the reviewer only if its encoded form fits comfortably inside one cookie. */
export function approvalAmountDraft(verifiedNeedAmount: string, approvedPublicTarget: string): string | null {
  const encoded = encodeURIComponent(JSON.stringify({ v: verifiedNeedAmount, t: approvedPublicTarget }));
  return encoded.length <= 3500 ? encoded : null;
}

/** The draft amounts back from the cookie, or empty strings if absent or unreadable. */
export function approvalAmountDraftFromCookie(value: string | undefined): { verifiedNeedAmount: string; approvedPublicTarget: string } {
  if (!value) return { verifiedNeedAmount: "", approvedPublicTarget: "" };
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as { v?: string; t?: string };
    return { verifiedNeedAmount: parsed.v ?? "", approvedPublicTarget: parsed.t ?? "" };
  } catch {
    return { verifiedNeedAmount: "", approvedPublicTarget: "" };
  }
}

/** The cookie that holds one request's draft amounts, or null if the id is not a plain identifier. The name is only ever
 * built from letters, digits, underscore and hyphen, so a crafted id cannot shape a cookie. */
export function approvalDraftCookieName(requestId: string): string | null {
  return /^[A-Za-z0-9_-]{8,40}$/.test(requestId) ? `amaana_ad_${requestId}` : null;
}

/** The words shown for a refused decision, in one place. */
export const APPROVAL_ERROR_MESSAGES = {
  draft_save_failed: "Review progress could not be saved. Refresh and check the current review before trying again.",
  incomplete: "Complete the checks listed before approving this request.",
  not_found: "That request could not be found.",
  linked_appeal: "This request has a linked appeal. Open the appeal to manage its status.",
  rejected: "This request was rejected. Move it back into review under Review before approving it.",
  closed: "This request is closed. Reopen the review under Review first if it needs to be approved.",
  not_eligible: "This request cannot be approved from its current state.",
  stale_request: "This request changed while you were reviewing it. Refresh the page and check it before approving.",
  stale_verification: "The review changed while you were reviewing it. Refresh the page and check it before approving.",
  forbidden: "Approval permission is required to approve a request.",
  reopen_forbidden: "Approval permission is required to reopen a completed verification.",
  form: "The form was not submitted correctly. Refresh the page and try again.",
  version: "The version of this request is missing or invalid. Refresh the page before approving.",
} as const;

export type ApprovalErrorCode = keyof typeof APPROVAL_ERROR_MESSAGES;

export type RequirementField = ApprovalFieldName | "otherFundingNotes" | "assignment" | "internalNotes" | "publicTitle" | "publicSummary" | "publicStory" | "coverImage";
export type RequirementLabel = "Required to approve" | "Required to publish" | "Optional" | "Not needed for this action";

const CORE_FIELDS = new Set<RequirementField>(Object.keys(CORE) as RequirementField[]);
const PUBLIC_ONLY = new Set<RequirementField>(["approvedPublicTarget", ...(Object.keys(CONSENT) as RequirementField[])]);
const PUBLICATION_COPY = new Set<RequirementField>(["publicTitle", "publicSummary", "publicStory"]);
const ALWAYS_OPTIONAL = new Set<RequirementField>(["otherFundingNotes", "assignment", "internalNotes"]);

/**
 * The words shown beside a field before submission: what is needed for this action. Never conveyed by colour alone and
 * never an unexplained asterisk. Rejection needs none of the approval fields.
 */
export function approvalRequirement(field: RequirementField, action: "reject" | ApprovalRoute): RequirementLabel {
  if (ALWAYS_OPTIONAL.has(field)) return "Optional";
  if (action === "reject") return "Not needed for this action";
  if (CORE_FIELDS.has(field)) return "Required to approve";
  if (PUBLIC_ONLY.has(field)) return action === "APPROVED_PUBLIC" ? "Required to approve" : "Not needed for this action";
  if (PUBLICATION_COPY.has(field)) return action === "APPROVED_PUBLIC" ? "Required to publish" : "Not needed for this action";
  return action === "APPROVED_PUBLIC" ? "Optional" : "Not needed for this action";
}
