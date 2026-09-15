import { describe, expect, it } from "vitest";
import { createDonationReference, createReceiptNumber, createReceiptToken, donationSchema, hashReceiptToken, isDonationAmountAllowedForRemaining } from "./donations";

const valid = { appealId: "cmf1234567890123456789012", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: "9876543210", amount: 500, domesticConfirmed: true };
describe("donation validation", () => {
  it("accepts a domestic INR donation", () => expect(donationSchema.safeParse(valid).success).toBe(true));
  it("requires domestic-source confirmation", () => expect(donationSchema.safeParse({ ...valid, domesticConfirmed: false }).success).toBe(false));
  it("enforces absolute donation limits before appeal context", () => { expect(donationSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false); expect(donationSchema.safeParse({ ...valid, amount: 1000001 }).success).toBe(false); });
  it("keeps the ₹10 minimum for normal donations", () => { expect(isDonationAmountAllowedForRemaining(9, 1_000)).toBe(false); expect(isDonationAmountAllowedForRemaining(10, 1_000)).toBe(true); });
  it("allows an exact smaller final contribution when less than ₹10 remains", () => { expect(isDonationAmountAllowedForRemaining(5, 5)).toBe(true); expect(isDonationAmountAllowedForRemaining(4, 5)).toBe(false); });
  it("rejects a donation above the remaining designated need", () => expect(isDonationAmountAllowedForRemaining(101, 100)).toBe(false));
  it("hashes receipt access tokens", () => { process.env.DONATION_TOKEN_PEPPER = "d".repeat(32); expect(hashReceiptToken("token")).toBe(hashReceiptToken("token")); expect(hashReceiptToken("token")).not.toBe(hashReceiptToken("other")); });
  it("creates donation and acknowledgement identifiers", () => { const reference = createDonationReference(); expect(reference).toMatch(/^AFD-\d{4}-\d{8}$/); expect(createReceiptNumber(reference)).toBe(`ACK-${reference}`); expect(createReceiptToken().length).toBeGreaterThan(20); });
});
