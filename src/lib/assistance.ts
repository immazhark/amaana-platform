import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";

export const assistanceCategories = ["MEDICAL", "EDUCATION", "LIVELIHOOD", "FOOD_HARDSHIP", "HOUSING", "EMERGENCY", "OTHER"] as const;
export const MANUAL_ASSISTANCE_STATUSES = ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED", "REJECTED", "CLOSED"] as const;
export const ASSISTANCE_INTERNAL_NOTES_MAX_LENGTH = 10_000;
export const ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH = 5_000;
export const ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH = 2_000;
export const ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH = 500;

export const ASSISTANCE_VERIFICATION_DECISIONS = ["PENDING", "APPROVED_PUBLIC", "APPROVED_PRIVATE", "APPROVED_PARTIAL", "REFERRED", "DECLINED"] as const;
export const ASSISTANCE_CONSENT_DECISIONS = ["UNCONFIRMED", "ALLOWED", "NOT_ALLOWED", "NOT_APPLICABLE"] as const;
export const ASSISTANCE_ZAKAT_STATUSES = ["UNREVIEWED", "ELIGIBLE", "NOT_ELIGIBLE", "NOT_APPLICABLE"] as const;
export const ASSISTANCE_CONFIDENTIALITY_LEVELS = ["STANDARD", "CONFIDENTIAL", "HIGHLY_SENSITIVE"] as const;

type AmountLike = { toNumber(): number } | number | string | null | undefined;
type PublicAppealVerificationLike = {
  needConfirmed: boolean;
  evidenceReviewed: boolean;
  verifiedNeedAmount: AmountLike;
  approvedPublicTarget: AmountLike;
  paymentDestination: string | null | undefined;
  otherFundingChecked: boolean;
  verificationSummary: string | null | undefined;
  decision: string;
  publicNameConsent: string;
  photoConsent: string;
  medicalDetailsConsent: string;
  institutionNameConsent: string;
  archiveConsent: string;
  zakatStatus: string;
  completedAt: Date | string | null | undefined;
};

export const assistanceSchema = z.object({
  applicantName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).optional(),
  city: z.string().trim().min(2).max(100),
  category: z.enum(assistanceCategories),
  description: z.string().trim().min(40).max(5000),
  consent: z.literal("on"),
});

export function isManualAssistanceStatusAllowed(
  previousStatus: string,
  nextStatus: string,
  hasLinkedAppeal: boolean,
) {
  if (previousStatus === "CONVERTED_TO_APPEAL" || hasLinkedAppeal) {
    return nextStatus === "CONVERTED_TO_APPEAL";
  }
  return (MANUAL_ASSISTANCE_STATUSES as readonly string[]).includes(nextStatus);
}

function amountToNumber(value: AmountLike) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

function isConsentResolved(value: string) {
  return value !== "UNCONFIRMED";
}

export function getPublicAppealVerificationIssues(verification: PublicAppealVerificationLike | null | undefined) {
  if (!verification) return ["Verification record is required."];

  const issues: string[] = [];
  const verifiedNeed = amountToNumber(verification.verifiedNeedAmount);
  const approvedTarget = amountToNumber(verification.approvedPublicTarget);

  if (!verification.needConfirmed) issues.push("Need must be confirmed.");
  if (!verification.evidenceReviewed) issues.push("Supporting evidence must be reviewed.");
  if (!verifiedNeed || !Number.isFinite(verifiedNeed) || verifiedNeed <= 0) issues.push("Verified need amount must be recorded.");
  if (!approvedTarget || !Number.isFinite(approvedTarget) || approvedTarget <= 0) issues.push("Approved public target must be recorded.");
  if (verifiedNeed && approvedTarget && approvedTarget > verifiedNeed) issues.push("Approved public target cannot exceed the verified need amount.");
  if (!verification.paymentDestination?.trim()) issues.push("Payment destination must be confirmed.");
  if (!verification.otherFundingChecked) issues.push("Other funding or duplicate fundraising must be checked.");
  if (!verification.verificationSummary?.trim()) issues.push("Verification summary is required.");
  if (verification.decision !== "APPROVED_PUBLIC") issues.push("Verification decision must approve a public appeal.");
  if (!isConsentResolved(verification.publicNameConsent)) issues.push("Public-name consent must be resolved.");
  if (!isConsentResolved(verification.photoConsent)) issues.push("Photo/media consent must be resolved, including not applicable when no beneficiary image will be used.");
  if (!isConsentResolved(verification.medicalDetailsConsent)) issues.push("Medical-detail disclosure consent must be resolved, including not applicable where irrelevant.");
  if (!isConsentResolved(verification.institutionNameConsent)) issues.push("Institution/hospital naming consent must be resolved, including not applicable where irrelevant.");
  if (!isConsentResolved(verification.archiveConsent)) issues.push("Public archive consent must be resolved.");
  if (verification.zakatStatus === "UNREVIEWED") issues.push("Zakat review must be recorded as eligible, not eligible, or not applicable.");
  if (!verification.completedAt) issues.push("Verification must be formally completed.");

  return issues;
}

export function canApproveAssistanceRequest(verification: Pick<PublicAppealVerificationLike, "decision" | "completedAt"> | null | undefined) {
  if (!verification?.completedAt) return false;
  return ["APPROVED_PUBLIC", "APPROVED_PRIVATE", "APPROVED_PARTIAL"].includes(verification.decision);
}

export const createReferenceNumber = () => `AF-${new Date().getUTCFullYear()}-${randomInt(100000, 1000000)}`;
export const createTrackingToken = () => randomBytes(24).toString("base64url");
export const hashTrackingToken = (token: string) => {
  const pepper = process.env.ASSISTANCE_TOKEN_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") throw new Error("Assistance token pepper is not configured");
  return createHash("sha256").update(`${token}:${pepper ?? "development-only"}`).digest("hex");
};
