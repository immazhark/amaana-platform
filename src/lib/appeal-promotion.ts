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
  return appeal.assistanceRequest?.verification?.confidentialityLevel !== "HIGHLY_SENSITIVE";
}
