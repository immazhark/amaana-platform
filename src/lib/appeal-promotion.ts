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

export function canPromoteAppeal(appeal: AppealPromotionPrivacy): boolean {
  // Standalone legacy appeals have no assistance verification to consult.
  if (!appeal.assistanceRequest) return true;

  // A linked case without an explicitly reviewed schema-defined privacy class
  // must not enter homepage, programme or related-appeal promotion surfaces.
  const level = appeal.assistanceRequest.verification?.confidentialityLevel;
  return level === "STANDARD" || level === "CONFIDENTIAL";
}
