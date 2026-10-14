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

-- Once a snapshot has been recorded, subsequent status, refund, reconciliation
-- or notification updates cannot rewrite the donor's selected purpose.
-- Historical nulls are deliberately allowed for backwards compatibility.
CREATE FUNCTION "prevent_donation_designation_snapshot_mutation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."designationSnapshot" IS NOT NULL
    AND NEW."designationSnapshot" IS DISTINCT FROM OLD."designationSnapshot"
  THEN
    RAISE EXCEPTION 'Donation designation snapshot is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Donation_designationSnapshot_immutable"
BEFORE UPDATE OF "designationSnapshot" ON "Donation"
FOR EACH ROW
EXECUTE FUNCTION "prevent_donation_designation_snapshot_mutation"();
