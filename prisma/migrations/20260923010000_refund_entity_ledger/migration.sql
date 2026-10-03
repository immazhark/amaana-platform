-- Additive upgrade. No historic donation/appeal totals are rewritten.
-- Stop application writers while migrating; the deployment startup runs this
-- before serving the new version. A rollback must not resume old refund writers.
BEGIN;
LOCK TABLE "PaymentEvent" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "RefundLedger" (
  "providerRefundId" TEXT NOT NULL PRIMARY KEY,
  "providerPaymentId" TEXT NOT NULL,
  "donationId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefundLedger_donationId_fkey" FOREIGN KEY ("donationId")
    REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RefundLedger_identity_check" CHECK (
    "providerRefundId" ~ '^rfnd_[A-Za-z0-9]+$' AND "providerPaymentId" ~ '^pay_[A-Za-z0-9]+$'
  ),
  CONSTRAINT "RefundLedger_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "RefundLedger_currency_check" CHECK ("currency" = 'INR')
);
CREATE INDEX "RefundLedger_donationId_processedAt_idx" ON "RefundLedger"("donationId", "processedAt");

-- Support both the current privacy-safe audit shape and the original envelope.
CREATE TEMP TABLE refund_upgrade_history ON COMMIT DROP AS
SELECT "donationId", "processedAt",
  COALESCE(payload->'refund', payload#>'{payload,refund,entity}') AS entity
FROM "PaymentEvent"
WHERE "eventType" = 'refund.processed' AND "donationId" IS NOT NULL;

-- Unverifiable historic accounting must be reconciled by an operator, not
-- silently omitted from the identity ledger (which would permit another debit).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM refund_upgrade_history
    WHERE entity IS NULL
      OR COALESCE(entity->>'id', '') !~ '^rfnd_[A-Za-z0-9]+$'
      OR COALESCE(entity->>'payment_id', '') !~ '^pay_[A-Za-z0-9]+$'
      OR COALESCE(entity->>'currency', '') <> 'INR'
      OR COALESCE(entity->>'amount', '') !~ '^[1-9][0-9]*$'
  ) THEN
    RAISE EXCEPTION 'Refund ledger upgrade requires review of incomplete historical refund identities';
  END IF;
  IF EXISTS (
    SELECT entity->>'id' FROM refund_upgrade_history
    GROUP BY entity->>'id'
    HAVING COUNT(DISTINCT ("donationId", entity->>'payment_id', entity->>'amount', entity->>'currency')) > 1
  ) THEN
    RAISE EXCEPTION 'Refund ledger upgrade requires review of conflicting historical refund identities';
  END IF;
END $$;

INSERT INTO "RefundLedger" ("providerRefundId", "providerPaymentId", "donationId", "amount", "currency", "processedAt")
SELECT entity->>'id', entity->>'payment_id', "donationId",
  (entity->>'amount')::NUMERIC / 100, entity->>'currency', MIN("processedAt")
FROM refund_upgrade_history
GROUP BY entity->>'id', entity->>'payment_id', "donationId", entity->>'amount', entity->>'currency';
COMMIT;

