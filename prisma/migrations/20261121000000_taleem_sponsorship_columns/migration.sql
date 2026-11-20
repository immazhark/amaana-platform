-- Taleem student sponsorship as a programme-level contribution (never a specific child). Additive: no existing row
-- changes, every new column is nullable, and an ordinary donation keeps all five at NULL.
--
-- The rate is recorded WITH the donation, so a later rate change can never rewrite what a donor was quoted
-- (the live catalogue and its approval state stay in src/content/taleem-catalogue.ts under version control).
ALTER TABLE "Donation" ADD COLUMN "sponsorshipProgramme" TEXT;
ALTER TABLE "Donation" ADD COLUMN "sponsorshipUnits" INTEGER;
ALTER TABLE "Donation" ADD COLUMN "sponsorshipMonths" INTEGER;
ALTER TABLE "Donation" ADD COLUMN "sponsorshipMonthlyRate" DECIMAL(12,2);
ALTER TABLE "Donation" ADD COLUMN "sponsorshipRateVersion" TEXT;

CREATE INDEX "Donation_sponsorshipProgramme_idx" ON "Donation"("sponsorshipProgramme");

-- A sponsorship records its programme, units, months, per-unit monthly rate and rate version together, or none of them.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_fields_together" CHECK (
  ("sponsorshipProgramme" IS NULL) = ("sponsorshipUnits" IS NULL)
  AND ("sponsorshipUnits" IS NULL) = ("sponsorshipMonths" IS NULL)
  AND ("sponsorshipMonths" IS NULL) = ("sponsorshipMonthlyRate" IS NULL)
  AND ("sponsorshipMonthlyRate" IS NULL) = ("sponsorshipRateVersion" IS NULL)
);
-- The programme is a catalogue slug; the application validates it against the catalogue, so adding a programme later
-- needs no migration.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_programme_slug"
  CHECK ("sponsorshipProgramme" IS NULL OR "sponsorshipProgramme" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
-- Mirrors the quote engine: 1 to 50 units; 1, 3, 6 or 12 months. A duration is a one-off payment, not a mandate.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_units_range"
  CHECK ("sponsorshipUnits" IS NULL OR "sponsorshipUnits" BETWEEN 1 AND 50);
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_months_allowed"
  CHECK ("sponsorshipMonths" IS NULL OR "sponsorshipMonths" IN (1, 3, 6, 12));
-- Whole-rupee rates only, so every gift is a whole-rupee amount like every other gift.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_rate_whole_rupees"
  CHECK ("sponsorshipMonthlyRate" IS NULL OR ("sponsorshipMonthlyRate" > 0 AND "sponsorshipMonthlyRate" = trunc("sponsorshipMonthlyRate")));
-- The gift is exactly units x months x the rate recorded with it. The covered gateway fee is never part of it.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_amount_exact"
  CHECK ("sponsorshipUnits" IS NULL OR "amount" = "sponsorshipUnits" * "sponsorshipMonths" * "sponsorshipMonthlyRate");
-- A sponsorship is a gift to a fund (Taleem), never to an appeal, and never also a seasonal-campaign gift.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_requires_fund"
  CHECK ("sponsorshipProgramme" IS NULL OR "fundId" IS NOT NULL);
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorship_not_campaign"
  CHECK ("sponsorshipProgramme" IS NULL OR "campaignId" IS NULL);

-- Rollback (only while no row uses the columns; run by hand, never by the deploy):
--   ALTER TABLE "Donation" DROP CONSTRAINT "Donation_sponsorship_not_campaign", DROP CONSTRAINT "Donation_sponsorship_requires_fund",
--     DROP CONSTRAINT "Donation_sponsorship_amount_exact", DROP CONSTRAINT "Donation_sponsorship_rate_whole_rupees",
--     DROP CONSTRAINT "Donation_sponsorship_months_allowed", DROP CONSTRAINT "Donation_sponsorship_units_range",
--     DROP CONSTRAINT "Donation_sponsorship_programme_slug", DROP CONSTRAINT "Donation_sponsorship_fields_together";
--   DROP INDEX "Donation_sponsorshipProgramme_idx";
--   ALTER TABLE "Donation" DROP COLUMN "sponsorshipRateVersion", DROP COLUMN "sponsorshipMonthlyRate",
--     DROP COLUMN "sponsorshipMonths", DROP COLUMN "sponsorshipUnits", DROP COLUMN "sponsorshipProgramme";
