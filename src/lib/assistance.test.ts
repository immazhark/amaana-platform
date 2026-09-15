import { describe, expect, it } from "vitest";
import { assistanceSchema, createReferenceNumber, createTrackingToken, hashTrackingToken, isManualAssistanceStatusAllowed } from "./assistance";

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
