-- Extend donations to support direct UPI and bank-transfer reconciliation without weakening Razorpay accounting.
-- DonationStatus values are committed by the immediately preceding migration.
CREATE TYPE "DonationPaymentMethod" AS ENUM ('RAZORPAY', 'DIRECT_UPI', 'BANK_TRANSFER');

ALTER TABLE "Donation"
  ADD COLUMN "paymentMethod" "DonationPaymentMethod" NOT NULL DEFAULT 'RAZORPAY',
  ADD COLUMN "transferReference" TEXT,
  ADD COLUMN "transferredAt" TIMESTAMP(3),
  ADD COLUMN "transferEvidenceKey" TEXT,
  ADD COLUMN "transferEvidenceName" TEXT,
  ADD COLUMN "transferEvidenceMimeType" TEXT,
  ADD COLUMN "transferEvidenceSize" INTEGER,
  ADD COLUMN "reconciliationNotes" TEXT,
  ADD COLUMN "reconciledAt" TIMESTAMP(3),
  ADD COLUMN "reconciledById" TEXT;

ALTER TABLE "Donation" ALTER COLUMN "provider" DROP NOT NULL;
ALTER TABLE "Donation" ALTER COLUMN "providerOrderId" DROP NOT NULL;

ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Donation_payment_method_shape_check" CHECK (
    ("paymentMethod" = 'RAZORPAY' AND "provider" IS NOT NULL AND "providerOrderId" IS NOT NULL AND "transferReference" IS NULL AND "transferredAt" IS NULL)
    OR
    ("paymentMethod" IN ('DIRECT_UPI', 'BANK_TRANSFER') AND "provider" IS NULL AND "providerOrderId" IS NULL AND "providerPaymentId" IS NULL AND "transferReference" IS NOT NULL AND "transferredAt" IS NOT NULL)
  ),
  ADD CONSTRAINT "Donation_transfer_status_check" CHECK (
    "paymentMethod" = 'RAZORPAY' OR "status" IN ('PENDING_VERIFICATION', 'CAPTURED', 'REJECTED', 'REFUNDED')
  ),
  ADD CONSTRAINT "Donation_transfer_evidence_shape_check" CHECK (
    ("transferEvidenceKey" IS NULL AND "transferEvidenceName" IS NULL AND "transferEvidenceMimeType" IS NULL AND "transferEvidenceSize" IS NULL)
    OR
    ("transferEvidenceKey" IS NOT NULL AND "transferEvidenceName" IS NOT NULL AND "transferEvidenceMimeType" IS NOT NULL AND "transferEvidenceSize" IS NOT NULL AND "transferEvidenceSize" > 0)
  );

CREATE UNIQUE INDEX "Donation_transferReference_key" ON "Donation"("transferReference");
CREATE UNIQUE INDEX "Donation_transferEvidenceKey_key" ON "Donation"("transferEvidenceKey");
CREATE INDEX "Donation_paymentMethod_status_createdAt_idx" ON "Donation"("paymentMethod", "status", "createdAt");
CREATE INDEX "Donation_reconciledById_reconciledAt_idx" ON "Donation"("reconciledById", "reconciledAt");
