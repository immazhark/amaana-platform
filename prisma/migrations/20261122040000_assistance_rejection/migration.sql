-- The reason an assistance request was rejected (assistance queue brief, sections 6 and 12). Additive: one new table, no
-- existing table, row or column changes, and nothing is backfilled. A legacy rejected request simply has no row here and
-- is shown as having no historical recorded reason; no reason, reviewer or time is ever invented for it.
--
-- Append-only by design: a request that is rejected, reopened and rejected again keeps every decision. A code rollback
-- leaves these rows in place, and they are never deleted by the application (they go with the request only if the request
-- itself is deleted under the retention rules).

-- CreateTable
CREATE TABLE "AssistanceRejection" (
    "id" TEXT NOT NULL,
    "assistanceRequestId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rejectedById" TEXT NOT NULL,
    "previousStatus" "AssistanceStatus" NOT NULL,
    "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistanceRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistanceRejection_assistanceRequestId_rejectedAt_idx" ON "AssistanceRejection"("assistanceRequestId", "rejectedAt");

-- CreateIndex
CREATE INDEX "AssistanceRejection_rejectedById_idx" ON "AssistanceRejection"("rejectedById");

-- AddForeignKey
ALTER TABLE "AssistanceRejection" ADD CONSTRAINT "AssistanceRejection_assistanceRequestId_fkey" FOREIGN KEY ("assistanceRequestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistanceRejection" ADD CONSTRAINT "AssistanceRejection_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The reason is present and bounded: 3 to 2000 characters after trimming. The application applies the fuller rule first
-- (at least one letter or digit, in any script) and returns a field error; the database keeps only the length bound,
-- because a character-class test here would depend on the database locale and could refuse a genuine Arabic or Telugu reason.
ALTER TABLE "AssistanceRejection" ADD CONSTRAINT "AssistanceRejection_reason_present"
  CHECK (length(btrim("reason")) BETWEEN 3 AND 2000);
