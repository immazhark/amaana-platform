-- Seasonal fixed-price campaigns for designated funds. Additive: no existing row changes.
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

CREATE TABLE "FundCampaign" (
  "id" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "unitLabel" TEXT NOT NULL,
  "unitLabelPlural" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "maxUnits" INTEGER NOT NULL DEFAULT 100,
  "opensAt" TIMESTAMP(3) NOT NULL,
  "closesAt" TIMESTAMP(3) NOT NULL,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundCampaign_pkey" PRIMARY KEY ("id"),
  -- Whole-rupee prices only, so every gift is a whole-rupee amount like every other gift.
  CONSTRAINT "FundCampaign_unit_price_whole_rupees" CHECK ("unitPrice" > 0 AND "unitPrice" = trunc("unitPrice")),
  CONSTRAINT "FundCampaign_max_units_range" CHECK ("maxUnits" BETWEEN 1 AND 1000),
  CONSTRAINT "FundCampaign_window_ordered" CHECK ("closesAt" > "opensAt")
);
CREATE UNIQUE INDEX "FundCampaign_slug_key" ON "FundCampaign"("slug");
CREATE INDEX "FundCampaign_fundId_status_opensAt_idx" ON "FundCampaign"("fundId", "status", "opensAt");
ALTER TABLE "FundCampaign" ADD CONSTRAINT "FundCampaign_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FundCampaign" ADD CONSTRAINT "FundCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Donation" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "units" INTEGER;
ALTER TABLE "Donation" ADD COLUMN "unitPrice" DECIMAL(12,2);
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "FundCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Donation_campaignId_idx" ON "Donation"("campaignId");
-- A campaign gift records its campaign, unit count and unit price together, or none of them.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaign_fields_together"
  CHECK (("campaignId" IS NULL) = ("units" IS NULL) AND ("units" IS NULL) = ("unitPrice" IS NULL));
-- The amount of a campaign gift is exactly units x the unit price recorded with it.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaign_amount_exact"
  CHECK ("units" IS NULL OR ("units" > 0 AND "amount" = "units" * "unitPrice"));
-- Campaigns belong to funds, never to appeals.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaign_requires_fund"
  CHECK ("campaignId" IS NULL OR "fundId" IS NOT NULL);
