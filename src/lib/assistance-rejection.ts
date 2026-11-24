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

/** What can be wrong with a submission. A token names the problem; its wording lives in one place below. */
export type RejectionProblem = "reason-missing" | "reason-short" | "reason-long" | "confirmation";

const MESSAGES: Record<RejectionProblem, string> = {
  "reason-missing": "Enter the reason for rejecting this request.",
  "reason-short": `Explain the reason in at least ${REJECTION_REASON_MIN_LENGTH} characters, using letters or numbers.`,
  "reason-long": `Keep the reason to ${REJECTION_REASON_MAX_LENGTH} characters or fewer.`,
  confirmation: "Confirm the rejection to continue.",
};

export const rejectionProblemMessage = (problem: RejectionProblem): string => MESSAGES[problem];

/** Every problem with a submission, in one pass, so the reviewer can fix them together. Empty when it can proceed. */
export function rejectionProblems(fields: Readonly<Record<string, unknown>>): RejectionProblem[] {
  const problems: RejectionProblem[] = [];
  const raw = typeof fields.reason === "string" ? fields.reason.trim() : "";
  if (!raw) problems.push("reason-missing");
  else if (raw.length > REJECTION_REASON_MAX_LENGTH) problems.push("reason-long");
  else if (raw.length < REJECTION_REASON_MIN_LENGTH || !/[\p{L}\p{N}]/u.test(raw)) problems.push("reason-short");
  // The checkbox's own value, exactly. Anything else is not an explicit confirmation.
  if (fields.confirmRejection !== "on") problems.push("confirmation");
  return problems;
}

/**
 * Validates a rejection submission from a bag of form fields, reading only `reason` and `confirmRejection` and ignoring
 * every other key. On success the result carries the trimmed reason and nothing else, so no approval value can travel
 * with a rejection.
 */
export function parseRejectionInput(fields: Readonly<Record<string, unknown>>): RejectionParse {
  const problems = rejectionProblems(fields);
  if (problems.length === 0) return { ok: true, reason: (fields.reason as string).trim() };
  const errors: RejectionFieldErrors = {};
  for (const problem of problems) {
    if (problem === "confirmation") errors.confirmation = MESSAGES[problem];
    else errors.reason = MESSAGES[problem];
  }
  return { ok: false, errors };
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

// ---- The outcome travels in the address; the private reason never does ----------------------------------------------
//
// The rejection form is plain server-rendered HTML that posts to a server action, so it needs no client JavaScript and
// still works if scripts fail to load. After the action the browser is redirected back to the request with a notice. The
// notice names only the outcome and which fields were wrong. What the reviewer typed is NOT put in the address (addresses
// are logged and shared): on a correctable error it is held in a short-lived, httpOnly, same-site cookie.

export type RejectionNotice =
  | { kind: "error"; problems: RejectionProblem[]; code: string | null }
  | { kind: "done"; outcome: "rejected" | "already_rejected" };

const PROBLEMS: readonly RejectionProblem[] = ["reason-missing", "reason-short", "reason-long", "confirmation"];
const ERROR_CODES = ["stale_request", "stale_verification", "linked_appeal", "closed", "not_found", "not_eligible", "forbidden", "form", "version"] as const;

export function rejectionRedirect(requestId: string, notice: RejectionNotice): string {
  const base = `/admin/requests/${encodeURIComponent(requestId)}`;
  if (notice.kind === "done") return `${base}?reject=done&o=${notice.outcome}#reject-heading`;
  const query = ["reject=error"];
  if (notice.problems.length) query.push(`e=${encodeURIComponent(notice.problems.join(","))}`);
  if (notice.code) query.push(`code=${notice.code}`);
  return `${base}?${query.join("&")}#reject-errors`;
}

const one = (value: string | string[] | undefined): string | null => (typeof value === "string" ? value : null);

/** Reads a notice back from the address, accepting only values this module writes, so a crafted link cannot put words on the page. */
export function parseRejectionNotice(search: Readonly<Record<string, string | string[] | undefined>>): RejectionNotice | null {
  const kind = one(search.reject);
  if (kind === "done") return { kind: "done", outcome: one(search.o) === "already_rejected" ? "already_rejected" : "rejected" };
  if (kind !== "error") return null;
  const listed = (one(search.e) ?? "").split(",").filter((token): token is RejectionProblem => (PROBLEMS as readonly string[]).includes(token));
  const code = one(search.code);
  return { kind: "error", problems: listed, code: code && (ERROR_CODES as readonly string[]).includes(code) ? code : null };
}

/** A draft reason is kept for the reviewer only if its encoded form fits comfortably inside one cookie. */
export function rejectionDraftCookieValue(reason: string): string | null {
  const encoded = encodeURIComponent(reason);
  return encoded.length <= 3500 ? encoded : null;
}

/** The draft back from the cookie, or an empty string if it is absent or unreadable. */
export function rejectionDraftFromCookie(value: string | undefined): string {
  if (!value) return "";
  try { return decodeURIComponent(value); } catch { return ""; }
}

/** The words shown for a refused decision, in one place. The first six are the service's own refusals; the last three are
 * for a submission that was not made correctly or by someone who may not reject. */
export const REJECTION_ERROR_MESSAGES = {
  not_found: "That request could not be found.",
  linked_appeal: "This request has a linked appeal. Open the appeal to manage its status.",
  closed: "This request is closed. Reopen the review first if it needs to be rejected.",
  not_eligible: "This request cannot be rejected from its current state.",
  stale_request: "This request changed while you were reviewing it. Refresh the page and check it before rejecting.",
  stale_verification: "The review changed while you were reviewing it. Refresh the page and check it before rejecting.",
  forbidden: "Approval permission is required to reject a request.",
  form: "The form was not submitted correctly. Refresh the page and try again.",
  version: "The version of this request is missing or invalid. Refresh the page before rejecting.",
} as const;

export type RejectionErrorCode = keyof typeof REJECTION_ERROR_MESSAGES;

/** The cookie that holds one request's draft reason, or null if the id is not a plain identifier. The name is only ever
 * built from letters, digits, underscore and hyphen, so a crafted id cannot shape a cookie. */
export function rejectionDraftCookieName(requestId: string): string | null {
  return /^[A-Za-z0-9_-]{8,40}$/.test(requestId) ? `amaana_rd_${requestId}` : null;
}
