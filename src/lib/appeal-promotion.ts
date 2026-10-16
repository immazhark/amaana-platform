/**
 * HIGHLY_SENSITIVE cases may retain an approved accountability URL, but their
 * original identity and case narrative must not be promoted through homepage,
 * live ticker, appeal directory or programme cross-promotion.
 */
export type AppealPromotionPrivacy = {
  assistanceRequest?: {
    verification?: { confidentialityLevel?: string | null } | null;
  } | null;
};

/** A public projection cannot treat missing linked verification as standard.
 * This is a display/search safety classification, not a database review edit. */
export function getAppealPublicPrivacyClass(
  appeal: AppealPromotionPrivacy,
): "STANDARD" | "CONFIDENTIAL" | "HIGHLY_SENSITIVE" {
  // Existing standalone public appeals have no linked private case to review.
  if (!appeal.assistanceRequest) return "STANDARD";

  const level = appeal.assistanceRequest.verification?.confidentialityLevel;
  if (level === "STANDARD" || level === "CONFIDENTIAL") return level;
  return "HIGHLY_SENSITIVE";
}

export function canPromoteAppeal(appeal: AppealPromotionPrivacy): boolean {
  return getAppealPublicPrivacyClass(appeal) !== "HIGHLY_SENSITIVE";
}
