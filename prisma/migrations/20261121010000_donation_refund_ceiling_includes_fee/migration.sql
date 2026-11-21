-- A refund returns the gateway fee a donor chose to cover FIRST, so the total refunded on a fee-covered donation can
-- legitimately reach gift + covered fee (the whole charge). The webhook already caps a provider refund at that charge
-- and records the full total, but the 2026-09-17 CHECK capped refundedAmount at the gift alone, so the UPDATE for a full
-- refund of a fee-covered donation would be refused and the refund never reconciled.
--
-- This only relaxes a ceiling: every existing row already satisfies the new rule, so no data changes. A donation with
-- no covered fee (feeContributionAmount = 0) keeps exactly the old ceiling.
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_refundedAmount_lte_amount_check";
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_refundedAmount_lte_charge_check"
  CHECK ("refundedAmount" <= "amount" + "feeContributionAmount");

-- Rollback (safe only while no row has refundedAmount above its gift; run by hand, never by the deploy):
--   ALTER TABLE "Donation" DROP CONSTRAINT "Donation_refundedAmount_lte_charge_check";
--   ALTER TABLE "Donation" ADD CONSTRAINT "Donation_refundedAmount_lte_amount_check" CHECK ("refundedAmount" <= "amount");
