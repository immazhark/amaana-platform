-- NULL preserves historical records without inventing a disclosure acceptance.
ALTER TABLE "Donation" ADD COLUMN "fundDisclosureConfirmedAt" TIMESTAMP(3);
CREATE FUNCTION "protect_fund_disclosure_confirmation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $fund_disclosure_guard$
BEGIN
  IF OLD."fundId" IS NOT NULL AND NEW."fundDisclosureConfirmedAt" IS DISTINCT FROM OLD."fundDisclosureConfirmedAt" THEN
    RAISE EXCEPTION 'Original fund disclosure confirmation is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fund_disclosure_guard$;
CREATE TRIGGER "Donation_fund_disclosure_confirmation_immutable"
BEFORE UPDATE OF "fundDisclosureConfirmedAt" ON "Donation"
FOR EACH ROW EXECUTE FUNCTION "protect_fund_disclosure_confirmation"();
