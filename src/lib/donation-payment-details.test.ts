import { afterEach, describe, expect, it } from "vitest";
import { getDonationPaymentDetails } from "./donation-payment-details";

const names = [
  "NEXT_PUBLIC_DONATION_UPI_QR_URL",
  "DONATION_BANK_ACCOUNT_NAME",
  "DONATION_BANK_ACCOUNT_NUMBER",
  "DONATION_BANK_IFSC",
  "DONATION_BANK_NAME",
  "DONATION_BANK_BRANCH",
] as const;

const original = Object.fromEntries(names.map(name => [name, process.env[name]]));

afterEach(() => {
  for (const name of names) {
    const value = original[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("donation payment details", () => {
  it("does not render a QR URL unless a safe URL is configured", () => {
    delete process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL;
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBeNull();

    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL = "/media/2026/donation-upi-qr.png";
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBe("/media/2026/donation-upi-qr.png");

    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL = "javascript:alert(1)";
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBeNull();
  });

  it("uses a complete configured bank identity and normalizes IFSC", () => {
    process.env.DONATION_BANK_ACCOUNT_NAME = "Amaana Foundation";
    process.env.DONATION_BANK_ACCOUNT_NUMBER = "123456789";
    process.env.DONATION_BANK_IFSC = "utib0002922";
    process.env.DONATION_BANK_NAME = "Axis Bank";
    process.env.DONATION_BANK_BRANCH = "Mehdipatnam";

    expect(getDonationPaymentDetails().bank).toEqual({
      accountName: "Amaana Foundation",
      accountNumber: "123456789",
      ifsc: "UTIB0002922",
      bankName: "Axis Bank",
      branch: "Mehdipatnam",
    });
  });

  it("fails closed to the existing canonical bank identity when configuration is partial", () => {
    process.env.DONATION_BANK_ACCOUNT_NAME = "Wrong partial override";
    delete process.env.DONATION_BANK_ACCOUNT_NUMBER;
    delete process.env.DONATION_BANK_IFSC;
    delete process.env.DONATION_BANK_NAME;
    delete process.env.DONATION_BANK_BRANCH;

    expect(getDonationPaymentDetails().bank).toEqual({
      accountName: "AMAANA FOUNDATION",
      accountNumber: "925020008040264",
      ifsc: "UTIB0002922",
      bankName: "Axis Bank",
      branch: "MEHDIPATNAM",
    });
  });
});
