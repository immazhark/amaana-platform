-- Preserve intrinsic dimensions for approved image media so public rendering can
-- reserve the correct aspect ratio. Existing and externally managed records remain nullable.
ALTER TABLE "MediaAsset"
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER;

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_width_positive" CHECK ("width" IS NULL OR "width" > 0),
  ADD CONSTRAINT "MediaAsset_height_positive" CHECK ("height" IS NULL OR "height" > 0);
