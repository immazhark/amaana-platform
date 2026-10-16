-- Drafts and separately approved anonymous copy remain admin-only.
-- This migration DOES NOT create a public query path or authorize publishing.
CREATE TYPE "AssistanceOutcomeDisclosureState" AS ENUM ('DRAFT', 'APPROVED_COPY', 'WITHDRAWN');
CREATE TABLE "AssistanceOutcomeDisclosure" (
  "id" TEXT NOT NULL,
  "observationId" TEXT NOT NULL,
  "copyText" VARCHAR(240) NOT NULL,
  "consentDocumentId" TEXT,
  "state" "AssistanceOutcomeDisclosureState" NOT NULL DEFAULT 'DRAFT',
  "preparedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssistanceOutcomeDisclosure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssistanceOutcomeDisclosure_review_check" CHECK (
    ("state" = 'DRAFT' AND "approvedAt" IS NULL AND "approvedById" IS NULL) OR
    ("state" <> 'DRAFT' AND "approvedAt" IS NOT NULL AND "approvedById" IS NOT NULL)
  ),
  CONSTRAINT "AssistanceOutcomeDisclosure_copy_check" CHECK (
    length(btrim("copyText")) BETWEEN 40 AND 240
  )
);
CREATE UNIQUE INDEX "AssistanceOutcomeDisclosure_observationId_key" ON "AssistanceOutcomeDisclosure" ("observationId");
CREATE UNIQUE INDEX "AssistanceOutcomeDisclosure_consentDocumentId_key" ON "AssistanceOutcomeDisclosure" ("consentDocumentId");
CREATE INDEX "AssistanceOutcomeDisclosure_state_createdAt_idx"
  ON "AssistanceOutcomeDisclosure" ("state", "createdAt");
ALTER TABLE "AssistanceOutcomeDisclosure" ADD CONSTRAINT "AssistanceOutcomeDisclosure_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "AssistanceOutcomeObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeDisclosure" ADD CONSTRAINT "AssistanceOutcomeDisclosure_consentDocumentId_fkey"
  FOREIGN KEY ("consentDocumentId") REFERENCES "AssistanceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeDisclosure" ADD CONSTRAINT "AssistanceOutcomeDisclosure_preparedById_fkey"
  FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceOutcomeDisclosure" ADD CONSTRAINT "AssistanceOutcomeDisclosure_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
