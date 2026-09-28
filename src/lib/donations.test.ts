import { describe, expect, it } from "vitest";
import { createDonationReference, createReceiptNumber, createReceiptToken, donationSchema, directTransferSchema, getDonationAcknowledgementPresentation, hashReceiptToken, isDonationAmountAllowedForRemaining } from "./donations";

const valid = { appealId: "cmf1234567890123456789012", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: "9876543210", amount: 500, givingIntent: "GENERAL", domesticConfirmed: true };
describe("donation validation", () => {
  it("accepts a domestic INR donation", () => expect(donationSchema.safeParse(valid).success).toBe(true));
  it("requires domestic-source confirmation", () => expect(donationSchema.safeParse({ ...valid, domesticConfirmed: false }).success).toBe(false));
  it("enforces absolute donation limits before appeal context", () => { expect(donationSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false); expect(donationSchema.safeParse({ ...valid, amount: 1000001 }).success).toBe(false); });
  it("keeps the ₹10 minimum for normal donations", () => { expect(isDonationAmountAllowedForRemaining(9, 1_000)).toBe(false); expect(isDonationAmountAllowedForRemaining(10, 1_000)).toBe(true); });
  it("allows an exact smaller final contribution when less than ₹10 remains", () => { expect(isDonationAmountAllowedForRemaining(5, 5)).toBe(true); expect(isDonationAmountAllowedForRemaining(4, 5)).toBe(false); });
  it("rejects a donation above the remaining designated need", () => expect(isDonationAmountAllowedForRemaining(101, 100)).toBe(false));
  it("validates direct transfer claims separately from Razorpay orders", () => {
    const claim = { ...valid, paymentMethod: "DIRECT_UPI", transferReference: "UTR123456789", transferredAt: new Date(Date.now() - 60_000) };
    expect(directTransferSchema.safeParse(claim).success).toBe(true);
    expect(directTransferSchema.safeParse({ ...claim, transferReference: "bad ref!" }).success).toBe(false);
    expect(directTransferSchema.safeParse({ ...claim, transferredAt: new Date(Date.now() + 60 * 60_000) }).success).toBe(false);
  });
  it("hashes receipt access tokens", () => { process.env.DONATION_TOKEN_PEPPER = "d".repeat(32); expect(hashReceiptToken("token")).toBe(hashReceiptToken("token")); expect(hashReceiptToken("token")).not.toBe(hashReceiptToken("other")); });
  it("creates donation and acknowledgement identifiers", () => { const reference = createDonationReference(); expect(reference).toMatch(/^AFD-\d{4}-\d{8}$/); expect(createReceiptNumber(reference)).toBe(`ACK-${reference}`); expect(createReceiptToken().length).toBeGreaterThan(20); });
});

describe("donation acknowledgement presentation", () => {
  it("shows a completed captured payment as verified", () => {
    const view = getDonationAcknowledgementPresentation("CAPTURED", 1_000, 0);
    expect(view.tone).toBe("captured");
    expect(view.statusLabel).toBe("Payment verified");
  });

  it("shows partial refunds without misclassifying the original payment", () => {
    const view = getDonationAcknowledgementPresentation("CAPTURED", 1_000, 250);
    expect(view.tone).toBe("captured");
    expect(view.statusLabel).toContain("Partially refunded");
  });

  it("shows a full refund as refunded", () => {
    const view = getDonationAcknowledgementPresentation("REFUNDED", 1_000, 1_000);
    expect(view.tone).toBe("refunded");
    expect(view.heading).toContain("refunded");
  });

  it("keeps submitted direct transfers explicitly unverified", () => {
    const view = getDonationAcknowledgementPresentation("PENDING_VERIFICATION", 1_000, 0);
    expect(view.tone).toBe("pending");
    expect(view.statusLabel).toBe("Verification pending");
    expect(view.summary.toLowerCase()).not.toContain("received");
  });

  it("shows rejected transfer claims as not verified", () => {
    const view = getDonationAcknowledgementPresentation("REJECTED", 1_000, 0);
    expect(view.tone).toBe("failed");
    expect(view.statusLabel).toBe("Transfer not verified");
  });

  it("does not describe a failed payment as pending verification", () => {
    const view = getDonationAcknowledgementPresentation("FAILED", 1_000, 0);
    expect(view.tone).toBe("failed");
    expect(view.statusLabel).toBe("Payment failed");
  });

  it("distinguishes authorized payments from newly created records", () => {
    expect(getDonationAcknowledgementPresentation("AUTHORIZED", 1_000, 0).statusLabel).toBe("Authorization received");
    expect(getDonationAcknowledgementPresentation("CREATED", 1_000, 0).statusLabel).toBe("Verification pending");
  });
});
