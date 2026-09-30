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

export function getDonationPaymentDetails(): DonationPaymentDetails {
  return { upi: { id: CANONICAL_UPI_ID, qrImageUrl: "/media/donation-upi-qr.svg" }, bank: { ...CANONICAL_BANK } };
}
