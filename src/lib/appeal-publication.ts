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

export function getFirstPublicationIssues(input: {
  fromStatus: string;
  toStatus: string;
  goalAmount: AmountLike;
  verification: VerificationLike;
}) {
  if (input.fromStatus !== "UNDER_REVIEW" || input.toStatus !== "PUBLISHED") return [];
  const issues = getPublicAppealVerificationIssues(input.verification);
  if (input.verification && !goalMatchesApprovedPublicTarget(input.goalAmount, input.verification)) {
    issues.push("Appeal goal must match the approved public fundraising target.");
  }
  return issues;
}
