import { describe, expect, it } from "vitest";
import { getAppealCoverMediaIssues } from "./appeal-cover-media";

const approvedMedia = {
  kind: "IMAGE",
  isPublic: true,
  privacyApprovedAt: new Date("2026-09-23T00:00:00Z"),
  publicUrl: "/media/2026/approved.webp",
};

const approvedReview = {
  privacyClass: "GREEN_PUBLIC",
  consentStatus: "DOCUMENTED",
  websiteApproved: true,
  provenanceConfirmed: true,
  containsPrivateDocument: false,
  containsMinor: false,
  containsPatient: false,
  heroEligible: true,
};

describe("appeal cover media gate", () => {
  it.each([undefined, null, "false", 0, true])("requires an explicit false private-document flag, rejecting %j", value => {
    expect(getAppealCoverMediaIssues(approvedMedia, { ...approvedReview, containsPrivateDocument: value })).toContain(
      "Appeal cover media cannot contain private documents or private data.",
    );
  });

  it.each(["containsMinor", "containsPatient"])("requires recorded boolean %s checks", field => {
    for (const value of [undefined, null, "false", 0]) {
      expect(getAppealCoverMediaIssues(approvedMedia, { ...approvedReview, [field]: value })).toContain(
        "Appeal cover media needs recorded child and patient privacy checks.",
      );
    }
  });

  it.each(["containsMinor", "containsPatient"])("requires documented consent when %s is true", field => {
    expect(getAppealCoverMediaIssues(approvedMedia, {
      ...approvedReview, [field]: true, consentStatus: "NOT_APPLICABLE",
    })).toContain("Identifiable child or patient cover media requires documented publication consent.");
    expect(getAppealCoverMediaIssues(approvedMedia, { ...approvedReview, [field]: true })).toEqual([]);
  });

  it.each([{ consentStatus: ["DOCUMENTED"] }, { consentStatus: { toString: null, valueOf: null } }])("rejects non-string consent metadata %j without coercion", ({ consentStatus }) => {
    expect(getAppealCoverMediaIssues(approvedMedia, { ...approvedReview, consentStatus })).toContain(
      "Appeal cover media consent does not permit general website use.",
    );
  });

  it("accepts not-applicable consent only for recorded non-identifying media", () => {
    expect(getAppealCoverMediaIssues(approvedMedia, { ...approvedReview, consentStatus: "NOT_APPLICABLE" })).toEqual([]);
  });

  it("accepts only currently public, privacy-approved, hero-approved image media", () => {
    expect(getAppealCoverMediaIssues(approvedMedia, approvedReview)).toEqual([]);
  });

  it("fails closed when the URL does not resolve to a reviewed media record", () => {
    expect(getAppealCoverMediaIssues(null, null)).toContain(
      "Cover image must reference an image from the approved Media review library.",
    );
  });

  it("blocks unpublished, non-image and non-hero media", () => {
    expect(getAppealCoverMediaIssues(
      { ...approvedMedia, kind: "DOCUMENT", isPublic: false, privacyApprovedAt: null },
      { ...approvedReview, heroEligible: false },
    )).toEqual(expect.arrayContaining([
      "Appeal cover media must be an image.",
      "Appeal cover media must still be public and privacy-approved.",
      "Appeal cover media requires explicit Hero use approved review.",
    ]));
  });

  it("requires the same provenance, website and consent controls used by publication review", () => {
    expect(getAppealCoverMediaIssues(approvedMedia, {
      ...approvedReview,
      privacyClass: "AMBER_RESTRICTED",
      consentStatus: "RESTRICTED",
      websiteApproved: false,
      provenanceConfirmed: false,
      containsPrivateDocument: true,
    })).toEqual(expect.arrayContaining([
      "Appeal cover media must have GREEN public-use classification.",
      "Appeal cover media must be approved for website use.",
      "Appeal cover media must have confirmed provenance.",
      "Appeal cover media cannot contain private documents or private data.",
      "Appeal cover media consent does not permit general website use.",
    ]));
  });

  it("fails closed when the structured review metadata is missing", () => {
    expect(getAppealCoverMediaIssues(approvedMedia, null)).toContain(
      "Appeal cover media needs a recorded structured privacy review.",
    );
  });
});
