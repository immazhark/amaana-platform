import { describe, expect, it } from "vitest";
import { canExposeAppealArchive, getAppealUpdatePublicationIssues } from "./appeal-update-publication";

const approvedVerification = {
  needConfirmed: true,
  evidenceReviewed: true,
  verifiedNeedAmount: 100000,
  approvedPublicTarget: 75000,
  paymentDestination: "Verified beneficiary or provider destination",
  otherFundingChecked: true,
  verificationSummary: "Need and supporting evidence reviewed privately.",
  decision: "APPROVED_PUBLIC",
  publicNameConsent: "NOT_APPLICABLE",
  photoConsent: "NOT_APPLICABLE",
  medicalDetailsConsent: "NOT_APPLICABLE",
  institutionNameConsent: "NOT_APPLICABLE",
  archiveConsent: "ALLOWED",
  zakatStatus: "NOT_APPLICABLE",
  completedAt: new Date("2026-09-16T00:00:00Z"),
};

describe("public appeal updates", () => {
  it("allows a reviewed update for a verified public appeal", () => {
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "PUBLISHED",
      privacyReviewed: true,
      hasAssistanceRequest: true,
      verification: approvedVerification,
    })).toEqual([]);
  });

  it("requires a privacy-and-consent review attestation", () => {
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "PUBLISHED",
      privacyReviewed: false,
      hasAssistanceRequest: true,
      verification: approvedVerification,
    })).toContain("Confirm that the update has been reviewed against the appeal privacy and consent boundaries.");
  });

  it("does not publish updates for draft or paused appeals", () => {
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "DRAFT",
      privacyReviewed: true,
      hasAssistanceRequest: false,
      verification: null,
    })).toContain("Public updates can only be published for an appeal that is currently public or completed.");
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "PAUSED",
      privacyReviewed: true,
      hasAssistanceRequest: false,
      verification: null,
    })).toContain("Public updates can only be published for an appeal that is currently public or completed.");
  });

  it("fails closed when a linked request no longer has a complete public verification", () => {
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "PUBLISHED",
      privacyReviewed: true,
      hasAssistanceRequest: true,
      verification: null,
    })).toContain("Verification record is required.");
  });

  it("keeps legacy standalone public appeals operable with explicit review", () => {
    expect(getAppealUpdatePublicationIssues({
      appealStatus: "CLOSED",
      privacyReviewed: true,
      hasAssistanceRequest: false,
      verification: null,
    })).toEqual([]);
  });
});

describe("completed appeal archive consent", () => {
  it("keeps an allowed or not-applicable linked archive public", () => {
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: true, archiveConsent: "ALLOWED" })).toBe(true);
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: true, archiveConsent: "NOT_APPLICABLE" })).toBe(true);
  });

  it("hides a linked completed appeal when archive consent is denied or unresolved", () => {
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: true, archiveConsent: "NOT_ALLOWED" })).toBe(false);
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: true, archiveConsent: "UNCONFIRMED" })).toBe(false);
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: true, archiveConsent: null })).toBe(false);
  });

  it("does not retroactively hide legacy standalone completed appeals", () => {
    expect(canExposeAppealArchive({ appealStatus: "CLOSED", hasAssistanceRequest: false, archiveConsent: null })).toBe(true);
  });

  it("does not use archive consent to hide an appeal before closure", () => {
    expect(canExposeAppealArchive({ appealStatus: "PUBLISHED", hasAssistanceRequest: true, archiveConsent: "NOT_ALLOWED" })).toBe(true);
    expect(canExposeAppealArchive({ appealStatus: "FUNDED", hasAssistanceRequest: true, archiveConsent: "NOT_ALLOWED" })).toBe(true);
  });
});
