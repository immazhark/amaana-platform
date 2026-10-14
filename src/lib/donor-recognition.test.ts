import { describe, expect, it } from "vitest";
import { canPublishDonorRecognition, parseDonorRecognitionName } from "./donor-recognition";

const approved = {
  status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
  recognitionDisplayName: "Ayesha Khan",
  recognitionRequestedAt: new Date("2026-10-13T10:00:00Z"),
  recognitionApprovedAt: new Date("2026-10-14T10:00:00Z"),
  recognitionRevokedAt: null,
};
describe("consent-governed Shukr donor publication", () => {
  it("accepts short respectful Unicode names but never addresses, digits or markup", () => {
    expect(parseDonorRecognitionName("  Ayesha  Khan  ")).toBe("Ayesha Khan");
    expect(parseDonorRecognitionName("محمد خان")).toBe("محمد خان");
    for (const input of ["", "A", "Ayesha@example.org", "Ayesha 123", "<b>Ayesha</b>", "https://example.org", "A".repeat(61), null]) {
      expect(parseDonorRecognitionName(input), String(input)).toBeNull();
    }
  });
  it("requires explicit donor request and later staff review", () => {
    expect(canPublishDonorRecognition(approved)).toBe(true);
    expect(canPublishDonorRecognition({ ...approved, recognitionRequestedAt: null })).toBe(false);
    expect(canPublishDonorRecognition({ ...approved, recognitionApprovedAt: null })).toBe(false);
    expect(canPublishDonorRecognition({ ...approved, recognitionApprovedAt: new Date("2026-10-12T10:00:00Z") })).toBe(false);
    expect(canPublishDonorRecognition({ ...approved, recognitionRevokedAt: new Date() })).toBe(false);
  });
  it("fails closed for anonymity, pending capture and any refund", () => {
    expect(canPublishDonorRecognition({ ...approved, isAnonymous: true })).toBe(false);
    for (const status of ["CREATED", "PENDING_VERIFICATION", "AUTHORIZED", "FAILED", "REFUNDED"]) {
      expect(canPublishDonorRecognition({ ...approved, status })).toBe(false);
    }
    expect(canPublishDonorRecognition({ ...approved, refundedAmount: 0.01 })).toBe(false);
    expect(canPublishDonorRecognition({ ...approved, recognitionDisplayName: null })).toBe(false);
    expect(canPublishDonorRecognition({ ...approved, recognitionDisplayName: "https://example.com" })).toBe(false);
  });
});
