import { isCspCompatiblePublicImageUrl, normalizeSafePublicMediaUrl } from "@/lib/public-media";

export type DonationPaymentDetails = {
  upi: { id: string; qrImageUrl: string | null };
  bank: { accountName: string; accountNumber: string; ifsc: string; bankName: string; branch: string } | null;
};

const CANONICAL_UPI_ID = "mab.037347029220157@axisbank";
// QR-only derivative from the owner-supplied Amaana payment poster. Its exact
// bytes are pinned by the native test; no patient or overseas instructions.
const CANONICAL_UPI_QR_URL = "/brand/amaana-upi-qr.png";
const CANONICAL_BANK = {
  accountName: "AMAANA FOUNDATION",
  accountNumber: "925020008040264",
  ifsc: "UTIB0002922",
  bankName: "Axis Bank",
  branch: "MEHDIPATNAM",
} as const;

function configuredBankDetails(): DonationPaymentDetails["bank"] {
  const configured = {
    accountName: process.env.DONATION_BANK_ACCOUNT_NAME?.trim(),
    accountNumber: process.env.DONATION_BANK_ACCOUNT_NUMBER?.trim(),
    ifsc: process.env.DONATION_BANK_IFSC?.trim().toUpperCase(),
    bankName: process.env.DONATION_BANK_NAME?.trim(),
    branch: process.env.DONATION_BANK_BRANCH?.trim(),
  };

  if (Object.values(configured).every(Boolean) &&
      /^[0-9]{9,18}$/.test(configured.accountNumber!) &&
      /^[A-Z]{4}0[A-Z0-9]{6}$/.test(configured.ifsc!)) {
    return configured as NonNullable<DonationPaymentDetails["bank"]>;
  }

  return { ...CANONICAL_BANK };
}

export function getDonationPaymentDetails(): DonationPaymentDetails {
  const configuredQr = normalizeSafePublicMediaUrl(process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL);

  return {
    upi: {
      id: CANONICAL_UPI_ID,
      // Do not call an arbitrary third-party QR image verified.
      // Only the official site or configured public media origin is acceptable.
      qrImageUrl: isCspCompatiblePublicImageUrl(configuredQr) ? configuredQr : CANONICAL_UPI_QR_URL,
    },
    bank: configuredBankDetails(),
  };
}
