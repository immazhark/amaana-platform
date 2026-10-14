import { describe, expect, it } from "vitest";
import { appealDonationDesignationSnapshot, createDonationReference, createReceiptNumber, createReceiptToken, donationSchema, directTransferSchema, getDonationAcknowledgementPresentation, hashReceiptToken, isDonationAmountAllowedForRemaining } from "./donations";

const valid = { appealId: "cmf1234567890123456789012", donorName: "Test Donor", donorEmail: "donor@example.com", donorPhone: "9876543210", amount: 500, givingIntent: "GENERAL", domesticConfirmed: true };
describe("donation validation", () => {
  it("preserves the original appeal purpose and donor-selected intention in a private snapshot", () => {
    const appeal = { id: "appeal-original", title: "Verified education support" };
    const snapshot = appealDonationDesignationSnapshot(appeal, "SADAQAH");
    appeal.title = "Later revised campaign title";
    expect(snapshot).toEqual({
      version: 1, kind: "APPEAL", appealId: "appeal-original",
      label: "Verified education support", givingIntent: "SADAQAH",
    });
  });
  it("accepts a domestic INR donation", () => expect(donationSchema.safeParse(valid).success).toBe(true));
  it.each(["cmf1234567890123456789013", "", null, 123, true, { id: "unreviewed-fund" }])("rejects an unsupported second destination %j instead of dropping it", fundId => {
    expect(donationSchema.safeParse({ ...valid, fundId }).success).toBe(false);
    expect(directTransferSchema.safeParse({ ...valid, fundId, paymentMethod: "DIRECT_UPI", transferReference: "UTR123456789", transferredAt: new Date(Date.now() - 60_000) }).success).toBe(false);
  });
  it("rejects a fund-only or missing designation while preserving legacy appeal-only input", () => {
    const { appealId, ...noAppeal } = valid;
    expect(appealId).toBeTruthy();
    expect(donationSchema.safeParse(noAppeal).success).toBe(false);
    expect(donationSchema.safeParse({ ...noAppeal, fundId: "cmf1234567890123456789013" }).success).toBe(false);
    expect(donationSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts digit-only form strings without coercing arbitrary input", () => {
    expect(donationSchema.safeParse({ ...valid, amount: "500" }).success).toBe(true);
    expect(donationSchema.safeParse({ ...valid, amount: "000500" }).success).toBe(true);
  });
  it.each(["1e3", "0x20", "500.0", "500 ", " 500", "+500", "-500", "", true, null, 500.5])(
    "rejects unsupported public amount input %s", amount => {
      expect(donationSchema.safeParse({ ...valid, amount }).success).toBe(false);
    },
  );
  it("requires domestic-source confirmation", () => expect(donationSchema.safeParse({ ...valid, domesticConfirmed: false }).success).toBe(false));
  it("enforces absolute donation limits before appeal context", () => { expect(donationSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false); expect(donationSchema.safeParse({ ...valid, amount: 1000001 }).success).toBe(false); });
  it("keeps the ₹10 minimum for normal donations", () => { expect(isDonationAmountAllowedForRemaining(9, 1_000)).toBe(false); expect(isDonationAmountAllowedForRemaining(10, 1_000)).toBe(true); });
  it("allows an exact smaller final contribution when less than ₹10 remains", () => { expect(isDonationAmountAllowedForRemaining(5, 5)).toBe(true); expect(isDonationAmountAllowedForRemaining(4, 5)).toBe(false); });
  it("rejects a donation above the remaining designated need", () => expect(isDonationAmountAllowedForRemaining(101, 100)).toBe(false));
  it.each([Number.NaN, Infinity, -Infinity, 0, -1])(
    "rejects an unsafe remaining fundraising amount of %s", remaining => {
      expect(isDonationAmountAllowedForRemaining(100, remaining)).toBe(false);
    },
  );
  it("still accepts a legitimate whole-rupee final remainder after rejecting bad amounts", () => {
    expect(isDonationAmountAllowedForRemaining(1, 1)).toBe(true);
    expect(isDonationAmountAllowedForRemaining(5, 5.5)).toBe(false);
    expect(isDonationAmountAllowedForRemaining(10, 10.5)).toBe(true);
  });

  it("validates direct transfer claims separately from Razorpay orders", () => {
    const claim = { ...valid, paymentMethod: "DIRECT_UPI", transferReference: "UTR123456789", transferredAt: new Date(Date.now() - 60_000) };
    expect(directTransferSchema.safeParse(claim).success).toBe(true);
    expect(directTransferSchema.safeParse({ ...claim, transferReference: "bad ref!" }).success).toBe(false);
    expect(directTransferSchema.safeParse({ ...claim, transferredAt: new Date(Date.now() + 60 * 60_000) }).success).toBe(false);
  });
  it("accepts a timezone-qualified direct-transfer timestamp without altering its instant", () => {
    const claim = {
      ...valid,
      paymentMethod: "BANK_TRANSFER",
      transferReference: "UTR123456789",
      transferredAt: "2026-10-12T11:15:30+05:30",
    };
    const parsed = directTransferSchema.safeParse(claim);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.transferredAt.toISOString()).toBe("2026-10-12T05:45:30.000Z");
  });

  it.each([null, undefined, "", "   ", false, true, 0, 1, "2026-10-12", "2026-10-12T11:15:30", {}])(
    "rejects invalid or timezone-less transfer date %j instead of silently storing 1970",
    transferredAt => {
      const claim = {
        ...valid,
        paymentMethod: "DIRECT_UPI",
        transferReference: "UTR123456789",
        transferredAt,
      };
      expect(directTransferSchema.safeParse(claim).success).toBe(false);
    },
  );

  it("hashes receipt access tokens", () => { process.env.DONATION_TOKEN_PEPPER = "d".repeat(32); expect(hashReceiptToken("token")).toBe(hashReceiptToken("token")); expect(hashReceiptToken("token")).not.toBe(hashReceiptToken("other")); });
  it("creates donation and acknowledgement identifiers", () => { const reference = createDonationReference(); expect(reference).toMatch(/^AFD-\d{4}-\d{8}$/); expect(createReceiptNumber(reference)).toBe(`ACK-${reference}`); expect(createReceiptToken().length).toBeGreaterThan(20); });
});

describe("donation acknowledgement presentation", () => {
  it("shows a completed captured payment as verified", () => {
    const view = getDonationAcknowledgementPresentation("CAPTURED", 1_000, 0);
    expect(view.tone).toBe("captured");
    expect(view.statusLabel).toBe("Payment verified");
  });

  it.each(["CREATED", "PENDING_VERIFICATION", "AUTHORIZED", "FAILED", "REJECTED"])(
    "never mislabels a %s donation as refunded from inconsistent totals", status => {
      const zero = getDonationAcknowledgementPresentation(status, 0, 0);
      const stale = getDonationAcknowledgementPresentation(status, 500, 500);
      expect(zero.tone).not.toBe("refunded");
      expect(stale.tone).not.toBe("refunded");
    },
  );

  it("requires positive finite captured accounting before inferring a refund", () => {
    expect(getDonationAcknowledgementPresentation("CAPTURED", 0, 0).tone).toBe("captured");
    expect(getDonationAcknowledgementPresentation("CAPTURED", 500, Number.NaN).tone).toBe("captured");
    expect(getDonationAcknowledgementPresentation("CAPTURED", 500, Number.POSITIVE_INFINITY).tone).toBe("captured");
    expect(getDonationAcknowledgementPresentation("CAPTURED", 500, 500).tone).toBe("refunded");
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
    expect(view.summary.toLowerCase()).toContain("utr/reference");
    expect(view.summary.toLowerCase()).toContain("bank or upi");
    expect(view.summary.toLowerCase()).not.toContain("razorpay");
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
