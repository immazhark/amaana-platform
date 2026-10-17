-- Private operational outcomes linked to a reviewed delivery, not public
-- case milestones, impact metrics or any payment/bank ledger transaction.
CREATE TYPE "AssistanceOutcomeKind" AS ENUM
  ('PARTIAL_SUPPORT', 'SPECIFIC_SUPPORT_COMPLETED', 'FURTHER_ACTION_REQUIRED');
CREATE TYPE "AssistanceOutcomeReviewState" AS ENUM ('REPORTED', 'REVIEWED', 'VOIDED');

CREATE TABLE "AssistanceOutcomeObservation" (
  "id" TEXT NOT NULL,
  "assistanceRequestId" TEXT NOT NULL,
  "deliveryRecordId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "kind" "AssistanceOutcomeKind" NOT NULL,
  "summary" VARCHAR(300) NOT NULL,
  "state" "AssistanceOutcomeReviewState" NOT NULL DEFAULT 'REPORTED',
  "reportedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssistanceOutcomeObservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssistanceOutcomeObservation_summary_check"
    CHECK (char_length(btrim("summary")) BETWEEN 20 AND 300),
  CONSTRAINT "AssistanceOutcomeObservation_review_check" CHECK (
    ("state" = 'REPORTED' AND "reviewedById" IS NULL AND "reviewedAt" IS NULL) OR
    ("state" <> 'REPORTED' AND "reviewedById" IS NOT NULL AND "reviewedAt" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "AssistanceOutcomeObservation_submissionId_key"
  ON "AssistanceOutcomeObservation" ("submissionId");
-- Once a report is voided, a corrected, independently reviewed observation
-- may be submitted. Two concurrent active reports cannot coexist.
CREATE UNIQUE INDEX "AssistanceOutcomeObservation_active_delivery_key"
  ON "AssistanceOutcomeObservation" ("deliveryRecordId")
  WHERE "state" IN ('REPORTED', 'REVIEWED');
CREATE INDEX "AssistanceOutcomeObservation_assistanceRequestId_state_createdAt_idx"
  ON "AssistanceOutcomeObservation" ("assistanceRequestId", "state", "createdAt");
CREATE INDEX "AssistanceOutcomeObservation_deliveryRecordId_state_idx"
  ON "AssistanceOutcomeObservation" ("deliveryRecordId", "state");
CREATE INDEX "AssistanceOutcomeObservation_state_createdAt_idx"
  ON "AssistanceOutcomeObservation" ("state", "createdAt");

ALTER TABLE "AssistanceOutcomeObservation" ADD CONSTRAINT "AssistanceOutcomeObservation_assistanceRequestId_fkey"
  FOREIGN KEY ("assistanceRequestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeObservation" ADD CONSTRAINT "AssistanceOutcomeObservation_deliveryRecordId_fkey"
  FOREIGN KEY ("deliveryRecordId") REFERENCES "AssistanceDeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeObservation" ADD CONSTRAINT "AssistanceOutcomeObservation_reportedById_fkey"
  FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeObservation" ADD CONSTRAINT "AssistanceOutcomeObservation_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
