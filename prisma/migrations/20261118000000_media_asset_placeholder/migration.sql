-- AF-R056: nullable blur-up placeholder (data URI, set only by the placeholder contract). Additive; no backfill.
ALTER TABLE "MediaAsset" ADD COLUMN "placeholder" TEXT;
