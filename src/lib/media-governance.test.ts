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

describe("media publication review form integrity", () => {
  const validForm = () => {
    const data = new FormData();
    data.set("privacyClass", "GREEN_PUBLIC");
    data.set("consentStatus", "DOCUMENTED");
    data.set("websiteApproved", "on");
    data.set("provenanceConfirmed", "on");
    data.set("reviewNotes", "Site-specific publication rights verified.");
    return data;
  };

  it("accepts a single complete and structured review", () => {
    expect(parseMediaPublicationReview(validForm())).toEqual({
      privacyClass: "GREEN_PUBLIC",
      consentStatus: "DOCUMENTED",
      websiteApproved: true,
      provenanceConfirmed: true,
      containsMinor: false,
      containsPatient: false,
      containsPrivateDocument: false,
      heroEligible: false,
      reviewNotes: "Site-specific publication rights verified.",
    });
  });

  it.each([
    "privacyClass", "consentStatus", "websiteApproved", "provenanceConfirmed",
    "containsMinor", "containsPatient", "containsPrivateDocument",
    "heroEligible", "reviewNotes",
  ])("rejects repeated %s review controls before any publication approval", field => {
    const data = validForm();
    data.append(field, field === "privacyClass" ? "RED_PRIVATE" : "on");
    expect(() => parseMediaPublicationReview(data)).toThrow(/Repeated/);
  });

  it.each([
    "privacyClass", "consentStatus", "websiteApproved", "containsMinor",
    "containsPatient", "containsPrivateDocument", "heroEligible",
    "provenanceConfirmed", "reviewNotes",
  ])("rejects uploaded File pretending to be review control %s", field => {
    const data = validForm();
    data.set(field, new File(["synthetic"], "fake.txt", { type: "text/plain" }));
    expect(() => parseMediaPublicationReview(data)).toThrow(/text field/i);
  });

  it.each([
    "websiteApproved", "containsMinor", "containsPatient",
    "containsPrivateDocument", "heroEligible", "provenanceConfirmed",
  ])("rejects non-checkbox value for %s instead of treating it as unchecked", field => {
    const data = validForm();
    data.set(field, "false");
    expect(() => parseMediaPublicationReview(data)).toThrow(/checkbox/i);
  });

  it("rejects review notes beyond the durable 2,000-character policy instead of silently truncating", () => {
    const data = validForm();
    data.set("reviewNotes", "x".repeat(2001));
    expect(() => parseMediaPublicationReview(data)).toThrow(/reviewNotes/i);
  });
});
