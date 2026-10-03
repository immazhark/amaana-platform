-- Enforce core monetary invariants at the PostgreSQL boundary.
-- These constraints mirror business rules already enforced by the application,
-- protecting against invalid direct writes and future application regressions.

ALTER TABLE "Appeal"
  ADD CONSTRAINT "Appeal_goalAmount_positive_check" CHECK ("goalAmount" > 0),
  ADD CONSTRAINT "Appeal_amountRaised_nonnegative_check" CHECK ("amountRaised" >= 0);

ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_amount_positive_check" CHECK ("amount" > 0),
  ADD CONSTRAINT "Donation_refundedAmount_nonnegative_check" CHECK ("refundedAmount" >= 0),
  ADD CONSTRAINT "Donation_refundedAmount_lte_amount_check" CHECK ("refundedAmount" <= "amount"),
  ADD CONSTRAINT "Donation_currency_inr_check" CHECK ("currency" = 'INR');
