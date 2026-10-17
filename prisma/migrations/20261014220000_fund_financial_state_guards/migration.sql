-- Fund-only state checks are additive; preserve existing appeal history.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fund_refund_state_check" CHECK (
  "fundId" IS NULL OR (
    "amount" <> 'NaN'::numeric AND "refundedAmount" <> 'NaN'::numeric
    AND ("status" <> 'REFUNDED' OR "refundedAmount" = "amount")
    AND ("status" IN ('CAPTURED', 'REFUNDED') OR "refundedAmount" = 0)
  )
);

CREATE FUNCTION "protect_fund_donation_original_amount"()
RETURNS TRIGGER LANGUAGE plpgsql AS $fund_original_amount$
BEGIN
  IF OLD."fundId" IS NOT NULL AND NEW."amount" IS DISTINCT FROM OLD."amount" THEN
    RAISE EXCEPTION 'Original fund donation amount is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fund_original_amount$;
CREATE TRIGGER "Donation_fund_original_amount_immutable"
BEFORE UPDATE OF "amount" ON "Donation"
FOR EACH ROW EXECUTE FUNCTION "protect_fund_donation_original_amount"();

-- Reviewed definitions cannot change while retaining an existing approval.
-- Return to DRAFT through the existing governance flow before editing.
CREATE FUNCTION "protect_reviewed_fund_definition"()
RETURNS TRIGGER LANGUAGE plpgsql AS $fund_definition_guard$
BEGIN
  IF NEW."createdById" IS DISTINCT FROM OLD."createdById" THEN
    RAISE EXCEPTION 'Fund creator is immutable' USING ERRCODE = '23514';
  END IF;
  IF ROW(NEW."slug", NEW."name", NEW."purpose", NEW."disclosure", NEW."accountCode", NEW."acceptedIntents", NEW."currency", NEW."lastEditedById")
    IS DISTINCT FROM ROW(OLD."slug", OLD."name", OLD."purpose", OLD."disclosure", OLD."accountCode", OLD."acceptedIntents", OLD."currency", OLD."lastEditedById") THEN
    IF OLD."status" <> 'DRAFT' OR NEW."status" <> 'DRAFT' OR NEW."revision"::bigint <> OLD."revision"::bigint + 1 THEN
      RAISE EXCEPTION 'Fund definition changes require a versioned draft' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$fund_definition_guard$;
CREATE TRIGGER "GivingFund_reviewed_definition_immutable"
BEFORE UPDATE ON "GivingFund"
FOR EACH ROW EXECUTE FUNCTION "protect_reviewed_fund_definition"();
