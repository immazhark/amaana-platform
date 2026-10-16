-- A withdrawn, never-approved draft must not falsely name an approver.
-- Previous approvals remain attributed after withdrawal, but draft
-- withdrawals have no approvedById/approvedAt. Their real actor and reason
-- are retained in the restricted AuditEvent table.
ALTER TABLE "AssistanceOutcomeDisclosure"
  DROP CONSTRAINT "AssistanceOutcomeDisclosure_review_check";

ALTER TABLE "AssistanceOutcomeDisclosure"
  ADD CONSTRAINT "AssistanceOutcomeDisclosure_review_check" CHECK (
    (
      "state"::text = 'DRAFT' AND
      "approvedById" IS NULL AND "approvedAt" IS NULL
    ) OR (
      "state"::text = 'WITHDRAWN' AND
      (("approvedById" IS NULL AND "approvedAt" IS NULL) OR
       ("approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL))
    ) OR (
      "state"::text IN ('APPROVED_COPY', 'PUBLISHED') AND
      "approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL
    )
  );
