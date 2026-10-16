-- Case-level bank-reference corroboration. This never transfers money,
-- modifies donor balances, or certifies live bank settlement.
CREATE TYPE "AssistanceFinancialReconciliationState" AS ENUM ('PENDING', 'EVIDENCE_REVIEWED', 'VOIDED');

CREATE TABLE "AssistanceFinancialReconciliation" (
  "id" TEXT NOT NULL,
  "deliveryRecordId" TEXT NOT NULL,
  "transactionReference" VARCHAR(64) NOT NULL,
  "bankProofDocumentId" TEXT NOT NULL,
  "status" "AssistanceFinancialReconciliationState" NOT NULL DEFAULT 'PENDING',
  "submittedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssistanceFinancialReconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssistanceFinancialReconciliation_review_check" CHECK (
    ("status" = 'PENDING' AND "reviewedAt" IS NULL AND "reviewedById" IS NULL) OR
    ("status" <> 'PENDING' AND "reviewedAt" IS NOT NULL AND "reviewedById" IS NOT NULL)
  ),
  CONSTRAINT "AssistanceFinancialReconciliation_ref_check" CHECK (
    length("transactionReference") BETWEEN 8 AND 64 AND
    "transactionReference" ~ '^[A-Z0-9/-]+$'
  )
);

CREATE UNIQUE INDEX "AssistanceFinancialReconciliation_deliveryRecordId_key"
  ON "AssistanceFinancialReconciliation"("deliveryRecordId");
CREATE UNIQUE INDEX "AssistanceFinancialReconciliation_transactionReference_key"
  ON "AssistanceFinancialReconciliation"("transactionReference");
CREATE INDEX "AssistanceFinancialReconciliation_status_createdAt_idx"
  ON "AssistanceFinancialReconciliation"("status","createdAt");
CREATE INDEX "AssistanceFinancialReconciliation_submittedById_createdAt_idx"
  ON "AssistanceFinancialReconciliation"("submittedById","createdAt");

ALTER TABLE "AssistanceFinancialReconciliation" ADD CONSTRAINT "AssistanceFinancialReconciliation_deliveryRecordId_fkey"
  FOREIGN KEY ("deliveryRecordId") REFERENCES "AssistanceDeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceFinancialReconciliation" ADD CONSTRAINT "AssistanceFinancialReconciliation_bankProofDocumentId_fkey"
  FOREIGN KEY ("bankProofDocumentId") REFERENCES "AssistanceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceFinancialReconciliation" ADD CONSTRAINT "AssistanceFinancialReconciliation_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceFinancialReconciliation" ADD CONSTRAINT "AssistanceFinancialReconciliation_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
