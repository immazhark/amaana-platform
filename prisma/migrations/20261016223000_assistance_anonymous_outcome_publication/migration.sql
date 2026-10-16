-- Published is a separate explicit release decision; previous copy approval
-- alone must never expose private outcomes.
ALTER TYPE "AssistanceOutcomeDisclosureState" ADD VALUE 'PUBLISHED';

ALTER TABLE "AssistanceOutcomeDisclosure"
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "AssistanceOutcomeDisclosure"
  ADD CONSTRAINT "AssistanceOutcomeDisclosure_publication_pair_check"
  CHECK (("publishedById" IS NULL AND "publishedAt" IS NULL)
    OR ("publishedById" IS NOT NULL AND "publishedAt" IS NOT NULL));

ALTER TABLE "AssistanceOutcomeDisclosure"
  ADD CONSTRAINT "AssistanceOutcomeDisclosure_published_requires_actor_check"
  CHECK ("state" <> 'PUBLISHED' OR
    ("publishedById" IS NOT NULL AND "publishedAt" IS NOT NULL));

ALTER TABLE "AssistanceOutcomeDisclosure"
  ADD CONSTRAINT "AssistanceOutcomeDisclosure_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AssistanceOutcomeDisclosure_state_publishedAt_idx"
  ON "AssistanceOutcomeDisclosure"("state", "publishedAt");
