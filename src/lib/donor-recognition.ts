/** A donor's non-anonymous receipt is not publication consent. The public
 * Shukr wall requires a separate affirmative, moderated and unrevoked request. */
export const DONOR_RECOGNITION_MAX_NAME = 60;

export function parseDonorRecognitionName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (name.length < 2 || name.length > DONOR_RECOGNITION_MAX_NAME) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return null;
  if (/\s{2,}|\.{2,}|-{2,}|'{2,}/u.test(name)) return null;
  // Do not allow usernames, contact information or formatting controls.
  if (/https?:|www\.|@|[\u0000-\u001f\u007f-\u009f]/iu.test(name)) return null;
  return name;
}

export type DonorRecognitionEligibility = {
  status: string;
  isAnonymous: boolean;
  refundedAmount: number;
  recognitionDisplayName: string | null;
  recognitionRequestedAt: Date | null;
  recognitionApprovedAt: Date | null;
  recognitionRevokedAt: Date | null;
};

/** Refunding even part of a donation disables recognition until staff and
 * donor can review it. No amount, payment reference or intent is ever public. */
export function canPublishDonorRecognition(value: DonorRecognitionEligibility): boolean {
  if (value.status !== "CAPTURED" || value.isAnonymous ||
      !Number.isFinite(value.refundedAmount) || value.refundedAmount !== 0) return false;
  if (!value.recognitionRequestedAt || !value.recognitionApprovedAt ||
      value.recognitionRevokedAt) return false;
  if (!Number.isFinite(value.recognitionRequestedAt.getTime()) ||
      !Number.isFinite(value.recognitionApprovedAt.getTime()) ||
      value.recognitionApprovedAt < value.recognitionRequestedAt) return false;
  return typeof value.recognitionDisplayName === "string" &&
    parseDonorRecognitionName(value.recognitionDisplayName) === value.recognitionDisplayName;
}
