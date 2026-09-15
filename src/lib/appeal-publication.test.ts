import { describe, expect, it } from "vitest";
import { getFirstPublicationIssues } from "./appeal-publication";

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

describe("first appeal publication gate", () => {
  it("allows first publication only with a completed public verification", () => {
    expect(getFirstPublicationIssues({
      fromStatus: "UNDER_REVIEW",
      toStatus: "PUBLISHED",
      verification: approvedVerification,
    })).toEqual([]);
  });

  it("fails closed when a new appeal has no linked verification", () => {
    expect(getFirstPublicationIssues({
      fromStatus: "UNDER_REVIEW",
      toStatus: "PUBLISHED",
      verification: null,
    })).toContain("Verification record is required.");
  });

  it("fails closed when public consent/review requirements are unresolved", () => {
    const issues = getFirstPublicationIssues({
      fromStatus: "UNDER_REVIEW",
      toStatus: "PUBLISHED",
      verification: { ...approvedVerification, archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED" },
    });
    expect(issues).toContain("Public archive consent must be resolved.");
    expect(issues).toContain("Zakat review must be recorded as eligible, not eligible, or not applicable.");
  });

  it("does not block lifecycle transitions for appeals that were already public", () => {
    expect(getFirstPublicationIssues({ fromStatus: "PAUSED", toStatus: "PUBLISHED", verification: null })).toEqual([]);
    expect(getFirstPublicationIssues({ fromStatus: "PUBLISHED", toStatus: "FUNDED", verification: null })).toEqual([]);
  });
});
