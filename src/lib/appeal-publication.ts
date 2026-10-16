import { getPublicAppealVerificationIssues } from "./assistance";

type VerificationLike = Parameters<typeof getPublicAppealVerificationIssues>[0];
type AmountLike = { toNumber(): number } | number | string | null | undefined;

function amountToNumber(value: AmountLike) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function goalMatchesApprovedPublicTarget(goalAmount: AmountLike, verification: VerificationLike) {
  const goal = amountToNumber(goalAmount);
  const target = amountToNumber(verification?.approvedPublicTarget);
  return goal !== null && target !== null && Number.isFinite(goal) && Number.isFinite(target) && goal === target;
}

export function getAppealConsentContentIssues(input: {
  verification: VerificationLike;
  beneficiaryDisplayName?: string | null;
  coverImageUrl?: string | null;
}) {
  if (!input.verification) return [];
  const issues: string[] = [];
  if (input.beneficiaryDisplayName?.trim() && input.verification.publicNameConsent !== "ALLOWED") {
    issues.push("A public beneficiary name requires explicit public-name consent.");
  }
  if (input.coverImageUrl?.trim() && input.verification.photoConsent === "NOT_ALLOWED") {
    issues.push("A beneficiary-related cover image cannot be used when photo/media consent is not allowed.");
  }
  return issues;
}

/** A paused appeal is public again when resumed. Recheck revoked review evidence
 * and public content, not only the initial UNDER_REVIEW publication.
 * Unlinked, previously public legacy appeals may resume without inventing a
 * new assistance verification record; their cover image is checked separately. */
export function getAppealPublicationIssues(input: {
  fromStatus: string;
  toStatus: string;
  goalAmount: AmountLike;
  verification: VerificationLike;
  hasAssistanceRequest?: boolean;
  beneficiaryDisplayName?: string | null;
  coverImageUrl?: string | null;
}) {
  if (input.toStatus !== "PUBLISHED") return [];
  const firstPublication = input.fromStatus === "UNDER_REVIEW";
  const resuming = input.fromStatus === "PAUSED";
  if (!firstPublication && !resuming) return [];
  if (resuming && !input.hasAssistanceRequest) return [];
  const issues = getPublicAppealVerificationIssues(input.verification);
  if (input.verification && !goalMatchesApprovedPublicTarget(input.goalAmount, input.verification)) {
    issues.push("Appeal goal must match the approved public fundraising target.");
  }
  issues.push(...getAppealConsentContentIssues(input));
  return issues;
}
