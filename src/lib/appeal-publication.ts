import { getPublicAppealVerificationIssues } from "@/lib/assistance";

type VerificationLike = Parameters<typeof getPublicAppealVerificationIssues>[0];

export function getFirstPublicationIssues(input: {
  fromStatus: string;
  toStatus: string;
  verification: VerificationLike;
}) {
  if (input.fromStatus !== "UNDER_REVIEW" || input.toStatus !== "PUBLISHED") return [];
  return getPublicAppealVerificationIssues(input.verification);
}
