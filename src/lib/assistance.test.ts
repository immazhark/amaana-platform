import { describe, expect, it } from "vitest";
import {
  assistanceSchema,
  canApproveAssistanceRequest,
  createReferenceNumber,
  createTrackingToken,
  getPublicAppealVerificationIssues,
  hashTrackingToken,
  isManualAssistanceStatusAllowed,
} from "./assistance";

describe("assistance intake", () => {
  it("accepts a complete domestic assistance request", () => expect(assistanceSchema.safeParse({ applicantName: "Test Applicant", phone: "+91 9876543210", email: "test@example.com", city: "Hyderabad", category: "MEDICAL", description: "A sufficiently detailed description of the verified assistance need.", consent: "on" }).success).toBe(true));
  it("rejects short descriptions and missing consent", () => expect(assistanceSchema.safeParse({ applicantName: "Test", phone: "9876543210", city: "Hyderabad", category: "MEDICAL", description: "Too short" }).success).toBe(false));
  it("hashes tracking tokens deterministically", () => { process.env.ASSISTANCE_TOKEN_PEPPER = "a".repeat(32); expect(hashTrackingToken("token")).toBe(hashTrackingToken("token")); expect(hashTrackingToken("token")).not.toBe(hashTrackingToken("other")); });
  it("creates non-empty references and tracking secrets", () => { expect(createReferenceNumber()).toMatch(/^AF-\d{4}-\d{6}$/); expect(createTrackingToken().length).toBeGreaterThan(20); });
});

describe("assistance workflow status guards", () => {
  it("allows ordinary review statuses before conversion", () => {
    expect(isManualAssistanceStatusAllowed("SUBMITTED", "UNDER_VERIFICATION", false)).toBe(true);
    expect(isManualAssistanceStatusAllowed("UNDER_VERIFICATION", "APPROVED", false)).toBe(true);
    expect(isManualAssistanceStatusAllowed("APPROVED", "CLOSED", false)).toBe(true);
  });

  it("does not allow staff to manually claim a request was converted", () => {
    expect(isManualAssistanceStatusAllowed("APPROVED", "CONVERTED_TO_APPEAL", false)).toBe(false);
  });

  it("does not allow a converted request to be moved away from its linked appeal state", () => {
    expect(isManualAssistanceStatusAllowed("CONVERTED_TO_APPEAL", "UNDER_VERIFICATION", true)).toBe(false);
    expect(isManualAssistanceStatusAllowed("CONVERTED_TO_APPEAL", "CONVERTED_TO_APPEAL", true)).toBe(true);
  });

  it("treats a linked appeal as authoritative even if the request status becomes stale", () => {
    expect(isManualAssistanceStatusAllowed("APPROVED", "CLOSED", true)).toBe(false);
    expect(isManualAssistanceStatusAllowed("APPROVED", "CONVERTED_TO_APPEAL", true)).toBe(true);
  });
});

describe("assistance verification gate", () => {
  const completePublicVerification = {
    needConfirmed: true,
    evidenceReviewed: true,
    verifiedNeedAmount: 100_000,
    approvedPublicTarget: 75_000,
    paymentDestination: "Verified hospital account",
    otherFundingChecked: true,
    verificationSummary: "Need, amount, destination, duplicate funding and disclosure permissions reviewed.",
    decision: "APPROVED_PUBLIC",
    publicNameConsent: "NOT_ALLOWED",
    photoConsent: "NOT_APPLICABLE",
    medicalDetailsConsent: "ALLOWED",
    institutionNameConsent: "ALLOWED",
    archiveConsent: "ALLOWED",
    zakatStatus: "NOT_APPLICABLE",
    completedAt: new Date("2026-09-15T12:00:00.000Z"),
  };

  it("accepts a completed public-appeal verification with resolved disclosure decisions", () => {
    expect(getPublicAppealVerificationIssues(completePublicVerification)).toEqual([]);
  });

  it("allows a public target below the total verified need for defined partial fundraising", () => {
    expect(getPublicAppealVerificationIssues({ ...completePublicVerification, verifiedNeedAmount: { toNumber: () => 100_000 }, approvedPublicTarget: { toNumber: () => 60_000 } })).toEqual([]);
  });

  it("blocks a public target above the verified need", () => {
    expect(getPublicAppealVerificationIssues({ ...completePublicVerification, approvedPublicTarget: 120_000 })).toContain("Approved public target cannot exceed the verified need amount.");
  });

  it("blocks publication when consent or Zakat review is unresolved", () => {
    const issues = getPublicAppealVerificationIssues({ ...completePublicVerification, photoConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED" });
    expect(issues).toContain("Photo/media consent must be resolved, including not applicable when no beneficiary image will be used.");
    expect(issues).toContain("Zakat review must be recorded as eligible, not eligible, or not applicable.");
  });

  it("requires a completed approved verification before generic request approval", () => {
    expect(canApproveAssistanceRequest({ decision: "APPROVED_PUBLIC", completedAt: new Date() })).toBe(true);
    expect(canApproveAssistanceRequest({ decision: "APPROVED_PRIVATE", completedAt: new Date() })).toBe(true);
    expect(canApproveAssistanceRequest({ decision: "DECLINED", completedAt: new Date() })).toBe(false);
    expect(canApproveAssistanceRequest({ decision: "APPROVED_PUBLIC", completedAt: null })).toBe(false);
  });
});
