import { normalizeSafePublicMediaUrl } from "@/lib/public-media";

export type DonationPaymentDetails = {
  upi: { id: string; qrImageUrl: string | null };
  bank: { accountName: string; accountNumber: string; ifsc: string; bankName: string; branch: string } | null;
};

const CANONICAL_UPI_ID = "mab.037347029220157@axisbank";
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

  if (Object.values(configured).every(Boolean)) {
    return configured as NonNullable<DonationPaymentDetails["bank"]>;
  }

  return { ...CANONICAL_BANK };
}

export function getDonationPaymentDetails(): DonationPaymentDetails {
  const configuredQr = normalizeSafePublicMediaUrl(process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL);

  return {
    upi: {
      id: CANONICAL_UPI_ID,
      qrImageUrl: configuredQr,
    },
    bank: configuredBankDetails(),
  };
}
