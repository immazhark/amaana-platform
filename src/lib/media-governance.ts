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

export function parseMediaPublicationReview(formData: FormData): MediaPublicationReview {
  const privacyClass = String(formData.get("privacyClass") ?? "") as MediaPrivacyClass;
  const consentStatus = String(formData.get("consentStatus") ?? "") as MediaConsentStatus;
  const validPrivacy = new Set<MediaPrivacyClass>(["GREEN_PUBLIC", "AMBER_RESTRICTED", "RED_PRIVATE"]);
  const validConsent = new Set<MediaConsentStatus>(["DOCUMENTED", "RESTRICTED", "NOT_APPROVED", "NOT_APPLICABLE"]);
  if (!validPrivacy.has(privacyClass)) throw new Error("Choose a media privacy classification before publication.");
  if (!validConsent.has(consentStatus)) throw new Error("Choose a consent status before publication.");

  return {
    privacyClass,
    consentStatus,
    websiteApproved: formData.get("websiteApproved") === "on",
    containsMinor: formData.get("containsMinor") === "on",
    containsPatient: formData.get("containsPatient") === "on",
    containsPrivateDocument: formData.get("containsPrivateDocument") === "on",
    heroEligible: formData.get("heroEligible") === "on",
    provenanceConfirmed: formData.get("provenanceConfirmed") === "on",
    reviewNotes: String(formData.get("reviewNotes") ?? "").trim().slice(0, 2000) || null,
  };
}
