-- Anonymous, aggregated public-route Core Web Vitals counts; no visitor-level data.
CREATE TABLE "DailyWebVital" (
    "id" TEXT NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "metric" VARCHAR(3) NOT NULL,
    "excellent" INTEGER NOT NULL DEFAULT 0,
    "good" INTEGER NOT NULL DEFAULT 0,
    "needsImprovement" INTEGER NOT NULL DEFAULT 0,
    "poor" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyWebVital_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyWebVital_metric_check" CHECK ("metric" IN ('LCP', 'INP', 'CLS')),
    CONSTRAINT "DailyWebVital_buckets_check" CHECK (
        "excellent" >= 0 AND "good" >= 0 AND
        "needsImprovement" >= 0 AND "poor" >= 0
    )
);
CREATE UNIQUE INDEX "DailyWebVital_path_date_metric_key" ON "DailyWebVital"("path", "date", "metric");
CREATE INDEX "DailyWebVital_date_idx" ON "DailyWebVital"("date");
