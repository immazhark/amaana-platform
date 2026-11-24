-- Designated giving funds. Additive and backward compatible: existing donations keep their appeal and
-- gain no fund; appealId becomes optional so fund donations need no appeal.
CREATE TYPE "FundStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');
CREATE TYPE "FundZakatPolicy" AS ENUM ('ACCEPTED', 'NOT_ACCEPTED', 'UNDER_REVIEW');
CREATE TYPE "DisbursementPool" AS ENUM ('ZAKAT', 'NON_ZAKAT');
CREATE TYPE "DisbursementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'VOID');

CREATE TABLE "Fund" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "zakatPolicy" "FundZakatPolicy" NOT NULL DEFAULT 'UNDER_REVIEW',
  "status" "FundStatus" NOT NULL DEFAULT 'DRAFT',
  "isGeneral" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Fund_slug_key" ON "Fund"("slug");
CREATE INDEX "Fund_status_sortOrder_idx" ON "Fund"("status", "sortOrder");
-- Only one general fund may exist.
CREATE UNIQUE INDEX "Fund_single_general_idx" ON "Fund"("isGeneral") WHERE "isGeneral" = true;

CREATE TABLE "FundDisbursement" (
  "id" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "pool" "DisbursementPool" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "spentOn" DATE NOT NULL,
  "financialYear" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publicSummary" TEXT,
  "status" "DisbursementStatus" NOT NULL DEFAULT 'DRAFT',
  "evidenceKey" TEXT,
  "createdById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "zakatEligibilityConfirmedAt" TIMESTAMP(3),
  "zakatEligibilityBasis" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundDisbursement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FundDisbursement_amount_positive" CHECK ("amount" > 0),
  -- Zakat may only be spent after eligibility of every recipient is confirmed and the basis recorded.
  CONSTRAINT "FundDisbursement_zakat_requires_eligibility" CHECK ("pool" <> 'ZAKAT' OR ("zakatEligibilityConfirmedAt" IS NOT NULL AND "zakatEligibilityBasis" IS NOT NULL)),
  CONSTRAINT "FundDisbursement_void_reason" CHECK ("status" <> 'VOID' OR ("voidedAt" IS NOT NULL AND "voidReason" IS NOT NULL))
);
CREATE INDEX "FundDisbursement_fundId_status_spentOn_idx" ON "FundDisbursement"("fundId", "status", "spentOn");
CREATE INDEX "FundDisbursement_financialYear_status_idx" ON "FundDisbursement"("financialYear", "status");
ALTER TABLE "FundDisbursement" ADD CONSTRAINT "FundDisbursement_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FundDisbursement" ADD CONSTRAINT "FundDisbursement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Donation" ADD COLUMN "fundId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "donorDirective" VARCHAR(500);
-- Optional gateway-fee cover added by the donor on top of the chosen donation amount (never part of the fund).
ALTER TABLE "Donation" ADD COLUMN "feeContributionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fee_contribution_nonnegative" CHECK ("feeContributionAmount" >= 0);
ALTER TABLE "Donation" ALTER COLUMN "appealId" DROP NOT NULL;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Every donation belongs to exactly one destination: an appeal or a fund.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_exactly_one_destination"
  CHECK (("appealId" IS NULL) <> ("fundId" IS NULL));
CREATE INDEX "Donation_fundId_givingIntent_status_createdAt_idx" ON "Donation"("fundId", "givingIntent", "status", "createdAt");

-- Starting funds named by the owner (Zakat rulings of 19 Nov 2026): accepted for General, Taleem, Modern
-- Education (eligibility shown per beneficiary), Medical (non-eligible cases tagged) and Orphan; refused for
-- the seasonal drives and Foundation Operations; Madarsa Operations stays UNDER_REVIEW (treated as not accepted).
INSERT INTO "Fund" ("id", "slug", "name", "summary", "zakatPolicy", "status", "isGeneral", "sortOrder", "updatedAt") VALUES
  ('fund_general', 'general', 'General Fund', 'Used where the need is greatest across Amaana Foundation''s work.', 'ACCEPTED', 'ACTIVE', true, 10, CURRENT_TIMESTAMP),
  ('fund_taleem', 'taleem', 'Taleem Fund', 'Qur''an and Islamic education sponsorship for children facing hardship.', 'ACCEPTED', 'ACTIVE', false, 20, CURRENT_TIMESTAMP),
  ('fund_modern_education', 'modern-education', 'Modern Education Fund', 'School and college fees for children facing hardship. Each sponsorship states whether the beneficiary is Zakat-eligible.', 'ACCEPTED', 'ACTIVE', false, 30, CURRENT_TIMESTAMP),
  ('fund_medical', 'medical', 'Medical Fund', 'Medical support for patients facing financial hardship. A case that is not Zakat-eligible is tagged as such.', 'ACCEPTED', 'ACTIVE', false, 40, CURRENT_TIMESTAMP),
  ('fund_orphan', 'orphan', 'Orphan Fund', 'Scholarships and essentials for orphaned children.', 'ACCEPTED', 'ACTIVE', false, 50, CURRENT_TIMESTAMP),
  ('fund_eid_kits', 'eid-kits', 'Eid Kits Fund', 'Eid gift kits for families in need. Zakat is not accepted for this fund.', 'NOT_ACCEPTED', 'ACTIVE', false, 60, CURRENT_TIMESTAMP),
  ('fund_qurbani', 'qurbani-meat', 'Qurbani Meat Fund', 'Eid al-Adha meat distribution. Zakat is not accepted for this fund.', 'NOT_ACCEPTED', 'ACTIVE', false, 70, CURRENT_TIMESTAMP),
  ('fund_dates', 'dates', 'Dates Fund', 'Dates distribution before Ramadan. Zakat is not accepted for this fund.', 'NOT_ACCEPTED', 'ACTIVE', false, 80, CURRENT_TIMESTAMP),
  ('fund_madarsa_operations', 'madarsa-operations', 'Madarsa Operations Fund', 'Teacher salaries and running costs of the partnered Madarsa.', 'UNDER_REVIEW', 'ACTIVE', false, 90, CURRENT_TIMESTAMP),
  ('fund_foundation_operations', 'foundation-operations', 'Foundation Operations Fund', 'Administration and recurring running costs of Amaana Foundation. Zakat is not accepted for this fund.', 'NOT_ACCEPTED', 'ACTIVE', false, 100, CURRENT_TIMESTAMP);
