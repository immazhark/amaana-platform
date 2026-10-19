import { describe, expect, it } from "vitest";
import { mediaPublicationIssues, parseMediaPublicationReview, type MediaPublicationReview } from "./media-governance";

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

describe("media publication review form boundary", () => {
  const flags = ["websiteApproved", "containsMinor", "containsPatient", "containsPrivateDocument", "heroEligible", "provenanceConfirmed"];
  const fields = ["privacyClass", "consentStatus", ...flags, "reviewNotes"];

  function form() {
    const data = new FormData();
    data.set("privacyClass", "GREEN_PUBLIC");
    data.set("consentStatus", "NOT_APPLICABLE");
    data.set("websiteApproved", "on");
    data.set("provenanceConfirmed", "on");
    return data;
  }

  it("retains normal unchecked flags and optional notes", () => {
    expect(parseMediaPublicationReview(form())).toEqual(safeReview);
  });

  it.each(fields)("rejects repeated review field %s", field => {
    const data = form();
    if (!data.has(field)) data.set(field, field === "reviewNotes" ? "Reviewed" : "on");
    data.append(field, "conflicting-value");
    expect(() => parseMediaPublicationReview(data)).toThrow(/single text/i);
  });

  it.each(fields)("rejects file-valued review field %s", field => {
    const data = form();
    data.set(field, new File(["not-review-text"], "review.txt"));
    expect(() => parseMediaPublicationReview(data)).toThrow(/single text/i);
  });

  it.each(flags)("rejects an unsupported %s value instead of treating it as unchecked", field => {
    const data = form();
    data.set(field, "false");
    expect(() => parseMediaPublicationReview(data)).toThrow(/checkbox/i);
  });

  it("retains checked sensitivity flags so publication remains blocked", () => {
    const data = form();
    data.set("containsPrivateDocument", "on");
    expect(mediaPublicationIssues(parseMediaPublicationReview(data))).toContain("Media containing identity, medical, banking, loan or other private documents cannot be published.");
  });
});

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
