-- Giving streams: every donation belongs to one stream; appealId is only required for APPEAL.
-- Additive and backward compatible: existing rows default to APPEAL and keep their appeal.
CREATE TYPE "GivingStream" AS ENUM ('GENERAL', 'APPEAL', 'EID_KITS', 'QURBANI', 'DATES', 'EDU_SPONSORSHIP', 'MADARSA_OPS');

ALTER TABLE "Donation" ADD COLUMN "stream" "GivingStream" NOT NULL DEFAULT 'APPEAL';
ALTER TABLE "Donation" ALTER COLUMN "appealId" DROP NOT NULL;

-- An appeal donation must name its appeal.
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_appeal_stream_requires_appeal"
  CHECK ("stream" <> 'APPEAL' OR "appealId" IS NOT NULL);

-- Zakat is never accepted for the seasonal distribution drives (Eid kits, Qurbani meat, dates).
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_no_zakat_on_seasonal_drives"
  CHECK ("stream" NOT IN ('EID_KITS', 'QURBANI', 'DATES') OR "givingIntent" <> 'ZAKAT');

CREATE INDEX "Donation_stream_givingIntent_status_createdAt_idx" ON "Donation"("stream", "givingIntent", "status", "createdAt");
