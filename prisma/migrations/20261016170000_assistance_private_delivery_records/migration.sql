-- Private case-level support-delivery reports: never count as donations or public impact.
CREATE TYPE "AssistanceDeliveryKind" AS ENUM ('FINANCIAL', 'IN_KIND');
CREATE TYPE "AssistanceDeliveryReviewState" AS ENUM ('REPORTED', 'CONFIRMED', 'VOIDED');
CREATE TABLE "AssistanceDeliveryRecord" (
  "id" TEXT NOT NULL,
  "assistanceRequestId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "kind" "AssistanceDeliveryKind" NOT NULL,
  "summary" VARCHAR(300) NOT NULL,
  "occurredOn" DATE NOT NULL,
  "amountInr" DECIMAL(12,2),
  "evidenceDocumentId" TEXT,
  "state" "AssistanceDeliveryReviewState" NOT NULL DEFAULT 'REPORTED',
  "reportedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssistanceDeliveryRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssistanceDeliveryRecord_summary_check"
    CHECK (char_length(btrim("summary")) BETWEEN 20 AND 300),
  CONSTRAINT "AssistanceDeliveryRecord_amount_check" CHECK (
    ("kind" = 'FINANCIAL' AND "amountInr" IS NOT NULL AND "amountInr" > 0) OR
    ("kind" = 'IN_KIND' AND "amountInr" IS NULL)
  ),
  CONSTRAINT "AssistanceDeliveryRecord_review_check" CHECK (
    ("state" = 'REPORTED' AND "reviewedAt" IS NULL AND "reviewedById" IS NULL) OR
    ("state" <> 'REPORTED' AND "reviewedAt" IS NOT NULL AND "reviewedById" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "AssistanceDeliveryRecord_submissionId_key" ON "AssistanceDeliveryRecord"("submissionId");
CREATE INDEX "AssistanceDeliveryRecord_assistanceRequestId_state_occurredOn_idx"
  ON "AssistanceDeliveryRecord"("assistanceRequestId", "state", "occurredOn");
CREATE INDEX "AssistanceDeliveryRecord_state_createdAt_idx" ON "AssistanceDeliveryRecord"("state", "createdAt");
CREATE INDEX "AssistanceDeliveryRecord_reportedById_createdAt_idx" ON "AssistanceDeliveryRecord"("reportedById", "createdAt");
ALTER TABLE "AssistanceDeliveryRecord" ADD CONSTRAINT "AssistanceDeliveryRecord_assistanceRequestId_fkey"
  FOREIGN KEY ("assistanceRequestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistanceDeliveryRecord" ADD CONSTRAINT "AssistanceDeliveryRecord_evidenceDocumentId_fkey"
  FOREIGN KEY ("evidenceDocumentId") REFERENCES "AssistanceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistanceDeliveryRecord" ADD CONSTRAINT "AssistanceDeliveryRecord_reportedById_fkey"
  FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceDeliveryRecord" ADD CONSTRAINT "AssistanceDeliveryRecord_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
