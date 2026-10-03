-- Back the paginated admin queue/reconciliation queries with indexes that match
-- their actual filter and ordering patterns. These are additive and do not
-- change application data or business semantics.

CREATE INDEX "Appeal_updatedAt_idx" ON "Appeal"("updatedAt");
CREATE INDEX "Donation_status_createdAt_idx" ON "Donation"("status", "createdAt");
CREATE INDEX "Donation_createdAt_idx" ON "Donation"("createdAt");
CREATE INDEX "AssistanceRequest_createdAt_idx" ON "AssistanceRequest"("createdAt");
