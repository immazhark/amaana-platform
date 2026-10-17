-- Optional ingestion metadata only. Existing assets retain their current fallback.
ALTER TABLE "MediaAsset" ADD COLUMN "blurDataURL" TEXT;
