-- Consolidate legacy public-detail pageviews into daily route families.
-- No donations, media, or beneficiary tables are modified.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE "DailyPageView" IN SHARE ROW EXCLUSIVE MODE;

WITH aggregates AS (
  SELECT
    '/' || split_part("path", '/', 2) || '/:slug' AS family,
    "date",
    SUM("views")::integer AS total
  FROM "DailyPageView"
  WHERE "path" ~ '^/(appeals|stories|our-work|programmes|faith-and-reflections)/[a-z0-9-]+$'
  GROUP BY 1, 2
)
INSERT INTO "DailyPageView" ("id", "path", "date", "views")
SELECT
  'anon_' || md5('public-pageview:' || family || ':' || "date"::text),
  family,
  "date",
  total
FROM aggregates
ON CONFLICT ("path", "date")
DO UPDATE SET "views" = "DailyPageView"."views" + EXCLUDED."views";

DELETE FROM "DailyPageView"
WHERE "path" ~ '^/(appeals|stories|our-work|programmes|faith-and-reflections)/[a-z0-9-]+$';
COMMIT;
