import { getPublicAppealVerificationIssues } from "./assistance";

type VerificationLike = Parameters<typeof getPublicAppealVerificationIssues>[0];
const publicUpdateStatuses = new Set(["PUBLISHED", "FUNDED", "CLOSED"]);

export function getAppealUpdatePublicationIssues(input: {
  appealStatus: string;
  privacyReviewed: boolean;
  hasAssistanceRequest: boolean;
  verification: VerificationLike;
}) {
  const issues: string[] = [];
  if (!publicUpdateStatuses.has(input.appealStatus)) {
    issues.push("Public updates can only be published for an appeal that is currently public or completed.");
  }
  if (!input.privacyReviewed) {
    issues.push("Confirm that the update has been reviewed against the appeal privacy and consent boundaries.");
  }
  if (input.hasAssistanceRequest) {
    issues.push(...getPublicAppealVerificationIssues(input.verification));
  }
  return [...new Set(issues)];
}

export function canExposeAppealArchive(input: {
  appealStatus: string;
  hasAssistanceRequest: boolean;
  archiveConsent: string | null | undefined;
}) {
  if (input.appealStatus !== "CLOSED") return true;
  if (!input.hasAssistanceRequest) return true;
  return input.archiveConsent === "ALLOWED" || input.archiveConsent === "NOT_APPLICABLE";
}
