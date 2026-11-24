-- Assistance eligibility and capacity (owner-approved 25 Nov 2026). Additive only: nullable columns and one new table. Nothing is
-- backfilled, so existing requests keep NULL residence and NULL acceptance; a request approved before this migration does not
-- count toward the annual capacity because no acceptance time is invented for it.

ALTER TABLE "AssistanceRequest" ADD COLUMN "beneficiaryResidence" TEXT;
ALTER TABLE "AssistanceRequest" ADD COLUMN "acceptedAt" TIMESTAMP(3);
ALTER TABLE "AssistanceRequest" ADD COLUMN "capacityExceptionNote" TEXT;
CREATE INDEX "AssistanceRequest_acceptedAt_idx" ON "AssistanceRequest"("acceptedAt");

ALTER TABLE "AssistanceRejection" ADD COLUMN "reasonCode" TEXT;

CREATE TABLE "AssistanceIntakeSetting" (
    "id" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssistanceIntakeSetting_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "AssistanceIntakeSetting" ADD CONSTRAINT "AssistanceIntakeSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
