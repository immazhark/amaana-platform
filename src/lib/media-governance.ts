import { singleFormValue } from "./single-form-value";

export type MediaPrivacyClass = "GREEN_PUBLIC" | "AMBER_RESTRICTED" | "RED_PRIVATE";
export type MediaConsentStatus = "DOCUMENTED" | "RESTRICTED" | "NOT_APPROVED" | "NOT_APPLICABLE";

export type MediaPublicationReview = {
  privacyClass: MediaPrivacyClass;
  consentStatus: MediaConsentStatus;
  websiteApproved: boolean;
  containsMinor: boolean;
  containsPatient: boolean;
  containsPrivateDocument: boolean;
  heroEligible: boolean;
  provenanceConfirmed: boolean;
  reviewNotes?: string | null;
};

export function mediaPublicationIssues(review: MediaPublicationReview) {
  const issues: string[] = [];

  if (review.privacyClass !== "GREEN_PUBLIC") {
    issues.push("Website publication requires GREEN public-use classification. AMBER material needs a safer derivative or narrower reviewed use; RED material must remain private.");
  }
  if (!review.websiteApproved) issues.push("Website is not included in the approved usage channels.");
  if (!review.provenanceConfirmed) issues.push("Source/provenance must be confirmed before website publication.");
  if (review.containsPrivateDocument) issues.push("Media containing identity, medical, banking, loan or other private documents cannot be published.");
  if (["NOT_APPROVED", "RESTRICTED"].includes(review.consentStatus)) {
    issues.push("Consent status does not permit general website publication.");
  }
  if ((review.containsMinor || review.containsPatient) && review.consentStatus !== "DOCUMENTED") {
    issues.push("Identifiable child or patient media requires documented publication consent.");
  }

  return issues;
}

/** Do not let an uploaded file or repeated form control override a
 * beneficiary consent declaration. Absence is acceptable for checkboxes only. */
function mediaReviewText(form: FormData, field: string): string | null {
  const value = singleFormValue(form, field);
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a text field.`);
  return value;
}

function mediaReviewChecked(form: FormData, field: string): boolean {
  const value = mediaReviewText(form, field);
  if (value !== null && value !== "on") {
    throw new Error(`Invalid ${field} checkbox value.`);
  }
  return value === "on";
}

export function parseMediaPublicationReview(formData: FormData): MediaPublicationReview {
  const privacyClass = mediaReviewText(formData, "privacyClass");
  const consentStatus = mediaReviewText(formData, "consentStatus");
  const validPrivacy = new Set<string>(["GREEN_PUBLIC", "AMBER_RESTRICTED", "RED_PRIVATE"]);
  const validConsent = new Set<string>(["DOCUMENTED", "RESTRICTED", "NOT_APPROVED", "NOT_APPLICABLE"]);
  if (!privacyClass || !validPrivacy.has(privacyClass)) {
    throw new Error("Choose a media privacy classification before publication.");
  }
  if (!consentStatus || !validConsent.has(consentStatus)) {
    throw new Error("Choose a consent status before publication.");
  }

  // Read every review control, including fields whose selected state would
  // otherwise be ignored. Reject ambiguous duplicates before persisting
  // an approval audit or writing a public media status.
  const websiteApproved = mediaReviewChecked(formData, "websiteApproved");
  const containsMinor = mediaReviewChecked(formData, "containsMinor");
  const containsPatient = mediaReviewChecked(formData, "containsPatient");
  const containsPrivateDocument = mediaReviewChecked(formData, "containsPrivateDocument");
  const heroEligible = mediaReviewChecked(formData, "heroEligible");
  const provenanceConfirmed = mediaReviewChecked(formData, "provenanceConfirmed");
  const reviewNotes = mediaReviewText(formData, "reviewNotes")?.trim() ?? "";
  if (reviewNotes.length > 2000) throw new Error("reviewNotes exceeds the 2,000-character limit.");

  return {
    privacyClass: privacyClass as MediaPrivacyClass,
    consentStatus: consentStatus as MediaConsentStatus,
    websiteApproved,
    containsMinor,
    containsPatient,
    containsPrivateDocument,
    heroEligible,
    provenanceConfirmed,
    reviewNotes: reviewNotes || null,
  };
}
