-- Additive indexes for the read-only operational views introduced during launch hardening.
-- They match the actual sort/filter patterns without changing data semantics.

CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

CREATE INDEX "DonationAttempt_createdAt_idx" ON "DonationAttempt"("createdAt");
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

CREATE INDEX "AuditEvent_entityType_action_createdAt_idx" ON "AuditEvent"("entityType", "action", "createdAt");
CREATE INDEX "MediaAsset_isPublic_sourceYear_sortOrder_createdAt_idx" ON "MediaAsset"("isPublic", "sourceYear", "sortOrder", "createdAt");
