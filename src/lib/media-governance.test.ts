import { describe, expect, it } from "vitest";
import { mediaPublicationIssues, type MediaPublicationReview } from "./media-governance";

const safeReview: MediaPublicationReview = {
  privacyClass: "GREEN_PUBLIC",
  consentStatus: "NOT_APPLICABLE",
  websiteApproved: true,
  containsMinor: false,
  containsPatient: false,
  containsPrivateDocument: false,
  heroEligible: false,
  provenanceConfirmed: true,
  reviewNotes: null,
};

describe("mediaPublicationIssues", () => {
  it("allows non-identifying, provenance-confirmed GREEN media for website use", () => {
    expect(mediaPublicationIssues(safeReview)).toEqual([]);
  });

  it("requires documented consent for child or patient media", () => {
    expect(mediaPublicationIssues({ ...safeReview, containsMinor: true })).toContain("Identifiable child or patient media requires documented publication consent.");
    expect(mediaPublicationIssues({ ...safeReview, containsPatient: true, consentStatus: "DOCUMENTED" })).toEqual([]);
  });

  it("fails closed for AMBER or RED media, private documents and missing provenance", () => {
    const issues = mediaPublicationIssues({
      ...safeReview,
      privacyClass: "AMBER_RESTRICTED",
      containsPrivateDocument: true,
      provenanceConfirmed: false,
    });
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it("does not treat restricted consent as broad website permission", () => {
    expect(mediaPublicationIssues({ ...safeReview, consentStatus: "RESTRICTED" })).toContain("Consent status does not permit general website publication.");
  });
});
