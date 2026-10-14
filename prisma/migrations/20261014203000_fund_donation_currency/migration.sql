-- Giving funds accept domestic INR only. Enforce on inserts and updates,
-- independently of checkout validation and the current fund approval state.
-- Legacy appeal donations remain subject to their existing payment contract.
ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_fund_currency_check"
  CHECK ("fundId" IS NULL OR "currency" = 'INR');
