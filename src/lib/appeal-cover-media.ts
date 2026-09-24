import type { MediaKind } from "@prisma/client";

type CoverMediaLike = {
  kind: MediaKind | string;
  isPublic: boolean;
  privacyApprovedAt: Date | string | null;
  publicUrl: string | null;
};

type ReviewMetadata = {
  privacyClass?: unknown;
  consentStatus?: unknown;
  websiteApproved?: unknown;
  provenanceConfirmed?: unknown;
  containsPrivateDocument?: unknown;
  heroEligible?: unknown;
};

function objectMetadata(value: unknown): ReviewMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ReviewMetadata;
}

export function getAppealCoverMediaIssues(media: CoverMediaLike | null, reviewMetadata: unknown) {
  const issues: string[] = [];
  if (!media) {
    issues.push("Cover image must reference an image from the approved Media review library.");
    return issues;
  }
  if (media.kind !== "IMAGE") issues.push("Appeal cover media must be an image.");
  if (!media.isPublic || !media.privacyApprovedAt) issues.push("Appeal cover media must still be public and privacy-approved.");
  if (!media.publicUrl?.trim()) issues.push("Appeal cover media must have a public delivery URL.");

  const review = objectMetadata(reviewMetadata);
  if (!review) {
    issues.push("Appeal cover media needs a recorded structured privacy review.");
    return issues;
  }
  if (review.privacyClass !== "GREEN_PUBLIC") issues.push("Appeal cover media must have GREEN public-use classification.");
  if (review.websiteApproved !== true) issues.push("Appeal cover media must be approved for website use.");
  if (review.provenanceConfirmed !== true) issues.push("Appeal cover media must have confirmed provenance.");
  if (review.containsPrivateDocument === true) issues.push("Appeal cover media cannot contain private documents or private data.");
  if (!["DOCUMENTED", "NOT_APPLICABLE"].includes(String(review.consentStatus ?? ""))) {
    issues.push("Appeal cover media consent does not permit general website use.");
  }
  if (review.heroEligible !== true) issues.push("Appeal cover media requires explicit Hero use approved review.");

  return issues;
}
