-- Append-only, one-time reversal of a reviewed internal allocation.
-- No cash movement, bank payment, donor refund or voucher is created.
CREATE TABLE "DonationAllocationReversal" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "reason" VARCHAR(240) NOT NULL,
  "reversedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DonationAllocationReversal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DonationAllocationReversal_proposalId_key" UNIQUE ("proposalId"),
  CONSTRAINT "DonationAllocationReversal_proposalId_fkey"
    FOREIGN KEY ("proposalId") REFERENCES "DonationAllocationProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DonationAllocationReversal_reversedById_fkey"
    FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DonationAllocationReversal_createdAt_idx" ON "DonationAllocationReversal"("createdAt");
