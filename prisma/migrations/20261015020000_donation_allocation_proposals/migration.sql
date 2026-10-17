-- Non-disbursing internal allocation proposals only. No bank transfer,
-- payment creation, beneficiary release, or automatic fund movement.
CREATE TYPE "AllocationProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TABLE "DonationAllocationProposal" (
  "id" TEXT NOT NULL,
  "donationId" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "purposeNote" VARCHAR(240) NOT NULL,
  "givingIntent" "DonationIntent" NOT NULL,
  "status" "AllocationProposalStatus" NOT NULL DEFAULT 'PENDING',
  "createdById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DonationAllocationProposal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AllocationProposal_positive_amount_chk" CHECK ("amountPaise" > 0 AND "amountPaise" <= 200000000),
  CONSTRAINT "AllocationProposal_distinct_reviewer_chk" CHECK ("reviewedById" IS NULL OR "reviewedById" <> "createdById"),
  CONSTRAINT "AllocationProposal_review_fields_chk" CHECK (
    ("status" = 'PENDING' AND "reviewedAt" IS NULL AND "reviewedById" IS NULL)
    OR ("status" <> 'PENDING' AND "reviewedAt" IS NOT NULL AND "reviewedById" IS NOT NULL)
  ),
  CONSTRAINT "DonationAllocationProposal_donationId_fkey"
    FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DonationAllocationProposal_fundId_fkey"
    FOREIGN KEY ("fundId") REFERENCES "GivingFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DonationAllocationProposal_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DonationAllocationProposal_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DonationAllocationProposal_donationId_status_idx" ON "DonationAllocationProposal"("donationId", "status");
CREATE INDEX "DonationAllocationProposal_fundId_status_createdAt_idx" ON "DonationAllocationProposal"("fundId", "status", "createdAt");
CREATE INDEX "DonationAllocationProposal_status_createdAt_idx" ON "DonationAllocationProposal"("status", "createdAt");
