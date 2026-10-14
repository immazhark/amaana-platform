-- Donor recognition is wholly optional, denied by default.
-- Existing donation records MUST NOT be backfilled or publicly exposed.
ALTER TABLE "Donation"
  ADD COLUMN "recognitionDisplayName" VARCHAR(60),
  ADD COLUMN "recognitionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "recognitionApprovedAt" TIMESTAMP(3),
  ADD COLUMN "recognitionRevokedAt" TIMESTAMP(3);
CREATE INDEX "Donation_recognitionApprovedAt_idx"
  ON "Donation"("recognitionApprovedAt")
  WHERE "recognitionApprovedAt" IS NOT NULL;
