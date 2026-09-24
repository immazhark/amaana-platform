-- Add an optimistic-concurrency version to private evidence records so
-- destructive retention operations can claim the exact reviewed version
-- before mutating external object storage.
ALTER TABLE "AssistanceDocument"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
