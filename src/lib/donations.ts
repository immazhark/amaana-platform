import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";

export const MIN_DONATION_AMOUNT = 10;
export const MAX_DONATION_AMOUNT = 1_000_000;

export const donationSchema = z.object({
  appealId: z.string().cuid(),
  donorName: z.string().trim().min(2).max(120),
  donorEmail: z.string().trim().email().max(254),
  donorPhone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/)]).optional(),
  amount: z.coerce.number().int().min(1).max(MAX_DONATION_AMOUNT),
  isAnonymous: z.boolean().optional().default(false),
  domesticConfirmed: z.literal(true),
});

export function isDonationAmountAllowedForRemaining(amount: number, remainingAmount: number) {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_DONATION_AMOUNT) return false;
  if (amount > remainingAmount) return false;
  return amount >= MIN_DONATION_AMOUNT || amount === remainingAmount;
}

export type DonationAcknowledgementPresentation = {
  tone: "captured" | "pending" | "failed" | "refunded";
  heading: string;
  summary: string;
  statusLabel: string;
};

export function getDonationAcknowledgementPresentation(
  status: string,
  amount: number,
  refundedAmount: number,
): DonationAcknowledgementPresentation {
  const hasPartialRefund = refundedAmount > 0 && refundedAmount < amount;

  if (status === "REFUNDED" || refundedAmount >= amount) {
    return {
      tone: "refunded",
      heading: "This donation has been refunded.",
      summary: "The payment was previously recorded and has since been refunded. This page remains available as a private transaction record.",
      statusLabel: "Refund processed",
    };
  }

  if (status === "CAPTURED") {
    return hasPartialRefund
      ? {
          tone: "captured",
          heading: "JazakAllahu Khairan.",
          summary: "Amaana Foundation recorded your contribution. A partial refund has since been processed and is shown below.",
          statusLabel: "Payment verified · Partially refunded",
        }
      : {
          tone: "captured",
          heading: "JazakAllahu Khairan.",
          summary: "Amaana Foundation gratefully acknowledges your contribution and the trust placed in this appeal.",
          statusLabel: "Payment verified",
        };
  }

  if (status === "FAILED") {
    return {
      tone: "failed",
      heading: "This payment was not completed.",
      summary: "This attempt is not recorded as a completed donation. If your bank or payment app shows a debit, retain the Razorpay confirmation and contact Amaana so the transaction can be checked safely.",
      statusLabel: "Payment failed",
    };
  }

  if (status === "AUTHORIZED") {
    return {
      tone: "pending",
      heading: "Your payment is authorized and being finalized.",
      summary: "Please retain this page and your Razorpay payment confirmation while capture and verification complete. Do not submit another payment for this donation.",
      statusLabel: "Authorization received",
    };
  }

  return {
    tone: "pending",
    heading: "Payment has not yet been verified.",
    summary: "A donation reference exists, but a completed payment has not yet been confirmed. If you already paid, retain your Razorpay confirmation and do not submit another payment until the transaction is checked.",
    statusLabel: "Verification pending",
  };
}

export const createDonationReference = () => `AFD-${new Date().getUTCFullYear()}-${randomInt(10000000, 100000000)}`;
export const createReceiptToken = () => randomBytes(24).toString("base64url");
export const hashReceiptToken = (token: string) => {
  const pepper = process.env.DONATION_TOKEN_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") throw new Error("Donation token pepper is not configured");
  return createHash("sha256").update(`${token}:${pepper ?? "development-only"}`).digest("hex");
};
export const createReceiptNumber = (reference: string) => `ACK-${reference}`;
