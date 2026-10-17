-- B08 expand migration. Existing appeal donations retain appealId and their
-- provider IDs, captured totals, receipts, refunds and original intent.
-- Application rollout must remain closed to fund checkout until all money paths
-- understand the exclusive destination invariant.
ALTER TABLE "Donation"
  ALTER COLUMN "appealId" DROP NOT NULL,
  ADD COLUMN "fundId" TEXT;

CREATE INDEX "Donation_fundId_status_createdAt_idx"
  ON "Donation"("fundId", "status", "createdAt");

ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_fundId_fkey"
  FOREIGN KEY ("fundId") REFERENCES "GivingFund"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Donation_exclusive_destination_check"
  CHECK (("appealId" IS NOT NULL) <> ("fundId" IS NOT NULL));

-- The previous migration only permits APPEAL snapshots. Replace it with a
-- purpose-specific constraint: historical appeal snapshots may still be NULL,
-- whereas every fund donation must carry a complete reviewed definition.
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_designationSnapshot_appeal_check";

ALTER TABLE "Donation" ADD CONSTRAINT "Donation_designationSnapshot_destination_check" CHECK (
  ("appealId" IS NOT NULL AND "fundId" IS NULL AND
    ("designationSnapshot" IS NULL OR COALESCE(
      jsonb_typeof("designationSnapshot") = 'object'
      AND "designationSnapshot" ->> 'version' = '1'
      AND "designationSnapshot" ->> 'kind' = 'APPEAL'
      AND "designationSnapshot" ->> 'appealId' = "appealId"
      AND "designationSnapshot" ->> 'givingIntent' = "givingIntent"::text
      AND jsonb_typeof("designationSnapshot" -> 'label') = 'string'
      AND length(btrim("designationSnapshot" ->> 'label')) BETWEEN 1 AND 4096,
    FALSE)))
  OR
  ("fundId" IS NOT NULL AND "appealId" IS NULL AND COALESCE(
    jsonb_typeof("designationSnapshot") = 'object'
    AND "designationSnapshot" ->> 'version' = '1'
    AND "designationSnapshot" ->> 'kind' = 'FUND'
    AND "designationSnapshot" ->> 'fundId' = "fundId"
    AND "designationSnapshot" ->> 'givingIntent' = "givingIntent"::text
    AND "givingIntent"::text IN ('GENERAL', 'SADAQAH')
    AND jsonb_typeof("designationSnapshot" -> 'fundRevision') = 'number'
    AND ("designationSnapshot" ->> 'fundRevision') ~ '^(0|[1-9][0-9]*)$'
    AND jsonb_typeof("designationSnapshot" -> 'label') = 'string'
    AND length(btrim("designationSnapshot" ->> 'label')) BETWEEN 1 AND 120
    AND jsonb_typeof("designationSnapshot" -> 'purpose') = 'string'
    AND length(btrim("designationSnapshot" ->> 'purpose')) BETWEEN 20 AND 1000
    AND jsonb_typeof("designationSnapshot" -> 'disclosure') = 'string'
    AND length(btrim("designationSnapshot" ->> 'disclosure')) BETWEEN 20 AND 2000
    AND jsonb_typeof("designationSnapshot" -> 'accountCode') = 'string'
    AND length(btrim("designationSnapshot" ->> 'accountCode')) BETWEEN 2 AND 32,
  FALSE))
);

-- Validate real approval and the frozen definition under a share lock.
-- An approval revoked before this insert cannot silently receive a new order.
-- Later PAUSED/CLOSED transitions do not rewrite already accepted donor intent.
CREATE FUNCTION "validate_giving_fund_donation_insert"()
RETURNS TRIGGER LANGUAGE plpgsql AS $fund_donation_insert_guard$
DECLARE
  current_fund "GivingFund"%ROWTYPE;
BEGIN
  IF NEW."fundId" IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO current_fund FROM "GivingFund"
    WHERE "id" = NEW."fundId" FOR SHARE;

  IF NOT FOUND OR current_fund."status" <> 'APPROVED'
     OR current_fund."currency" <> 'INR'
     OR current_fund."approvedAt" IS NULL
     OR current_fund."approvedById" IS NULL
     OR current_fund."approvedById" = current_fund."createdById"
     OR current_fund."approvedById" = current_fund."lastEditedById"
     OR NOT (NEW."givingIntent" = ANY(current_fund."acceptedIntents"))
     OR NEW."designationSnapshot" ->> 'fundRevision' <> current_fund."revision"::text
     OR NEW."designationSnapshot" ->> 'label' <> current_fund."name"
     OR NEW."designationSnapshot" ->> 'purpose' <> current_fund."purpose"
     OR NEW."designationSnapshot" ->> 'disclosure' <> current_fund."disclosure"
     OR NEW."designationSnapshot" ->> 'accountCode' <> current_fund."accountCode"
  THEN
    RAISE EXCEPTION 'Giving fund designation is not independently approved and current'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fund_donation_insert_guard$;

CREATE TRIGGER "Donation_validate_fund_insert"
BEFORE INSERT ON "Donation"
FOR EACH ROW EXECUTE FUNCTION "validate_giving_fund_donation_insert"();

-- Include the new destination in the existing donor-purpose immutability rule.
CREATE OR REPLACE FUNCTION "prevent_donation_designation_snapshot_mutation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $donation_designation_guard$
BEGIN
  IF NEW."designationSnapshot" IS DISTINCT FROM OLD."designationSnapshot"
    OR NEW."appealId" IS DISTINCT FROM OLD."appealId"
    OR NEW."fundId" IS DISTINCT FROM OLD."fundId"
    OR NEW."givingIntent" IS DISTINCT FROM OLD."givingIntent"
  THEN
    RAISE EXCEPTION 'Donation destination and intention are immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$donation_designation_guard$;

DROP TRIGGER "Donation_designationSnapshot_immutable" ON "Donation";
CREATE TRIGGER "Donation_designationSnapshot_immutable"
BEFORE UPDATE OF "designationSnapshot", "appealId", "fundId", "givingIntent" ON "Donation"
FOR EACH ROW EXECUTE FUNCTION "prevent_donation_designation_snapshot_mutation"();
