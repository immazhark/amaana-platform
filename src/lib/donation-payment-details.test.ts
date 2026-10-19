import { afterEach, describe, expect, it } from "vitest";
import { getDonationPaymentDetails } from "./donation-payment-details";

const names = [
  "NEXT_PUBLIC_DONATION_UPI_QR_URL",
  "NEXT_PUBLIC_APP_URL",
  "PUBLIC_MEDIA_BASE_URL",
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

  it("never describes a third-party QR image as a verified UPI destination", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://amaanafoundation.org";
    process.env.PUBLIC_MEDIA_BASE_URL = "https://media.amaanafoundation.org";
    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL = "https://unknown-payment.example/donor-qr.png";
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBeNull();

    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL = "https://media.amaanafoundation.org/reviewed/qr.png";
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBe("https://media.amaanafoundation.org/reviewed/qr.png");

    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL = "https://amaanafoundation.org/media/2026/qr.png";
    expect(getDonationPaymentDetails().upi.qrImageUrl).toBe("https://amaanafoundation.org/media/2026/qr.png");
  });

  it("rejects malformed bank overrides, keeping the verified canonical fallback", () => {
    process.env.DONATION_BANK_ACCOUNT_NAME = "Amaana Foundation";
    process.env.DONATION_BANK_ACCOUNT_NUMBER = "123456789";
    process.env.DONATION_BANK_IFSC = "INVALIDBANK";
    process.env.DONATION_BANK_NAME = "Axis Bank";
    process.env.DONATION_BANK_BRANCH = "Mehdipatnam";
    expect(getDonationPaymentDetails().bank?.accountNumber).toBe("925020008040264");

    process.env.DONATION_BANK_IFSC = "UTIB0002922";
    process.env.DONATION_BANK_ACCOUNT_NUMBER = "1234<span>";
    expect(getDonationPaymentDetails().bank?.accountNumber).toBe("925020008040264");
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
