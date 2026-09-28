export type DonationPaymentDetails = {
  upi: { id: string; qrImageUrl: string | null };
  bank: { accountName: string; accountNumber: string; ifsc: string; bankName: string; branch: string } | null;
};

const CANONICAL_UPI_ID = "mab.037347029220157@axisbank";

export function getDonationPaymentDetails(): DonationPaymentDetails {
  const accountName = process.env.DONATION_BANK_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.DONATION_BANK_ACCOUNT_NUMBER?.trim();
  const ifsc = process.env.DONATION_BANK_IFSC?.trim().toUpperCase();
  const bankName = process.env.DONATION_BANK_NAME?.trim();
  const branch = process.env.DONATION_BANK_BRANCH?.trim();
  const bank = accountName && accountNumber && ifsc && bankName && branch ? { accountName, accountNumber, ifsc, bankName, branch } : null;
  const qrImageUrl = process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL?.trim() || null;
  return { upi: { id: CANONICAL_UPI_ID, qrImageUrl }, bank };
}
