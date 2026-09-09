import { describe, expect, it } from "vitest";
import { assistanceSchema, createReferenceNumber, createTrackingToken, hashTrackingToken } from "./assistance";

describe("assistance intake", () => {
  it("accepts a complete domestic assistance request", () => expect(assistanceSchema.safeParse({ applicantName: "Test Applicant", phone: "+91 9876543210", email: "test@example.com", city: "Hyderabad", category: "MEDICAL", description: "A sufficiently detailed description of the verified assistance need.", consent: "on" }).success).toBe(true));
  it("rejects short descriptions and missing consent", () => expect(assistanceSchema.safeParse({ applicantName: "Test", phone: "9876543210", city: "Hyderabad", category: "MEDICAL", description: "Too short" }).success).toBe(false));
  it("hashes tracking tokens deterministically", () => { process.env.ASSISTANCE_TOKEN_PEPPER = "a".repeat(32); expect(hashTrackingToken("token")).toBe(hashTrackingToken("token")); expect(hashTrackingToken("token")).not.toBe(hashTrackingToken("other")); });
  it("creates non-empty references and tracking secrets", () => { expect(createReferenceNumber()).toMatch(/^AF-\d{4}-\d{6}$/); expect(createTrackingToken().length).toBeGreaterThan(20); });
});
