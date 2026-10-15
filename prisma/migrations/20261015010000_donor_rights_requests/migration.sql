-- Per-donation privacy-rights triage; no donor names, contact fields, free
-- text, raw receipt tokens, or auto-deletion instructions are persisted.
CREATE TYPE "DonorRightsRequestKind" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION_REVIEW');
CREATE TYPE "DonorRightsRequestStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED');
CREATE TABLE "DonorRightsRequest" (
  "id" TEXT NOT NULL,
  "donationId" TEXT NOT NULL,
  "kind" "DonorRightsRequestKind" NOT NULL,
  "status" "DonorRightsRequestStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  CONSTRAINT "DonorRightsRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DonorRightsRequest_donationId_fkey" FOREIGN KEY ("donationId")
    REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DonorRightsRequest_donationId_kind_status_createdAt_idx"
  ON "DonorRightsRequest"("donationId", "kind", "status", "createdAt");
CREATE INDEX "DonorRightsRequest_status_createdAt_idx"
  ON "DonorRightsRequest"("status", "createdAt");
