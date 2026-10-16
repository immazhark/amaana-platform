-- Internal follow-up tasks are restricted to authorized assistance staff.
-- Date-only due dates describe operator commitments, not verified case urgency.
CREATE TYPE "AssistanceFollowUpState" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

CREATE TABLE "AssistanceFollowUp" (
    "id" TEXT NOT NULL,
    "assistanceRequestId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "summary" VARCHAR(300) NOT NULL,
    "dueOn" DATE NOT NULL,
    "state" "AssistanceFollowUpState" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssistanceFollowUp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AssistanceFollowUp_resolution_check" CHECK (
      ("state" = 'OPEN' AND "resolvedAt" IS NULL AND "resolvedById" IS NULL) OR
      ("state" <> 'OPEN' AND "resolvedAt" IS NOT NULL AND "resolvedById" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "AssistanceFollowUp_submissionId_key" ON "AssistanceFollowUp"("submissionId");
CREATE INDEX "AssistanceFollowUp_assistanceRequestId_state_dueOn_idx" ON "AssistanceFollowUp"("assistanceRequestId", "state", "dueOn");
CREATE INDEX "AssistanceFollowUp_state_dueOn_idx" ON "AssistanceFollowUp"("state", "dueOn");
CREATE INDEX "AssistanceFollowUp_createdById_createdAt_idx" ON "AssistanceFollowUp"("createdById", "createdAt");

ALTER TABLE "AssistanceFollowUp" ADD CONSTRAINT "AssistanceFollowUp_assistanceRequestId_fkey"
  FOREIGN KEY ("assistanceRequestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistanceFollowUp" ADD CONSTRAINT "AssistanceFollowUp_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistanceFollowUp" ADD CONSTRAINT "AssistanceFollowUp_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
