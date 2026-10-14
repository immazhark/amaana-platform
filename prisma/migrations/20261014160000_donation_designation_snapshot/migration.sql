-- Expand only: legacy donations remain valid, including those created by an
-- older application binary while the new release is being deployed.
ALTER TABLE "Donation" ADD COLUMN "designationSnapshot" JSONB;

-- Snapshot contents are private financial history, never a public appeal feed.
-- Constrain current appeal-only records without silently enabling fund checkout.
ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_designationSnapshot_appeal_check" CHECK (
    "designationSnapshot" IS NULL
    OR COALESCE(
      jsonb_typeof("designationSnapshot") = 'object'
      AND "designationSnapshot" ->> 'version' = '1'
      AND "designationSnapshot" ->> 'kind' = 'APPEAL'
      AND "designationSnapshot" ->> 'appealId' = "appealId"
      AND "designationSnapshot" ->> 'givingIntent' = "givingIntent"::text
      AND jsonb_typeof("designationSnapshot" -> 'label') = 'string',
      FALSE
    )
  );

-- Historic NULL snapshots remain NULL: past donor intent cannot be
-- reconstructed by a later edit. Both old and new donations retain their
-- original appeal identity and giving intention throughout payment/refund life.
CREATE FUNCTION "prevent_donation_designation_snapshot_mutation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $
BEGIN
  IF NEW."designationSnapshot" IS DISTINCT FROM OLD."designationSnapshot"
    OR NEW."appealId" IS DISTINCT FROM OLD."appealId"
    OR NEW."givingIntent" IS DISTINCT FROM OLD."givingIntent"
  THEN
    RAISE EXCEPTION 'Donation destination and intention are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$;

CREATE TRIGGER "Donation_designationSnapshot_immutable"
BEFORE UPDATE OF "designationSnapshot", "appealId", "givingIntent" ON "Donation"
FOR EACH ROW
EXECUTE FUNCTION "prevent_donation_designation_snapshot_mutation"();
