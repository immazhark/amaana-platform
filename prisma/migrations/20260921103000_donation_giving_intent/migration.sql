-- Record donor giving intention separately from appeal designation and
-- separately from internal beneficiary Zakat eligibility review.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DonationIntent') THEN
    CREATE TYPE "DonationIntent" AS ENUM ('GENERAL', 'SADAQAH', 'ZAKAT');
  END IF;
END $$;

ALTER TABLE "Donation"
ADD COLUMN IF NOT EXISTS "givingIntent" "DonationIntent" NOT NULL DEFAULT 'GENERAL';

CREATE INDEX IF NOT EXISTS "Donation_givingIntent_createdAt_idx"
ON "Donation"("givingIntent", "createdAt");
