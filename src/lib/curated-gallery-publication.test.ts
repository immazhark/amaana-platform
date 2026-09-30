import { describe, expect, it } from "vitest";
import { mediaPublicationIssues, type MediaPublicationReview } from "@/lib/media-governance";

const batchReview: MediaPublicationReview = {
  privacyClass: "GREEN_PUBLIC",
  consentStatus: "DOCUMENTED",
  websiteApproved: true,
  containsMinor: true,
  containsPatient: true,
  containsPrivateDocument: false,
  heroEligible: false,
  provenanceConfirmed: true,
  reviewNotes: "Owner-approved exact curated gallery batch.",
};

describe("curated gallery publication review", () => {
  it("passes the existing media privacy gate with documented consent and gallery-only approval", () => {
    expect(mediaPublicationIssues(batchReview)).toEqual([]);
    expect(batchReview.heroEligible).toBe(false);
  });

  it("fails closed if the owner-approved batch is marked as private-document media", () => {
    expect(mediaPublicationIssues({ ...batchReview, containsPrivateDocument: true })).toContain(
      "Media containing identity, medical, banking, loan or other private documents cannot be published.",
    );
  });

  it("fails closed if documented consent is removed for potentially sensitive people", () => {
    const issues = mediaPublicationIssues({ ...batchReview, consentStatus: "NOT_APPLICABLE" });
    expect(issues.some(issue => issue.includes("Identifiable child or patient media requires documented publication consent."))).toBe(true);
  });
});
