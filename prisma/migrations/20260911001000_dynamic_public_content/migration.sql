-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FaithContentType" AS ENUM ('ARTICLE', 'REMINDER', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReligiousReviewStatus" AS ENUM ('NOT_REQUIRED', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'EXTERNAL_VIDEO');

-- AlterTable
ALTER TABLE "Appeal" ADD COLUMN "causeId" TEXT,
ADD COLUMN "initiativeId" TEXT;

-- CreateTable
CREATE TABLE "Cause" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cause_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "year" INTEGER,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    "primaryMetric" TEXT,
    "primaryMetricLabel" TEXT,
    "financialSummary" JSONB,
    "publishedAt" TIMESTAMP(3),
    "causeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sourceNote" TEXT,
    "privacyApprovedAt" TIMESTAMP(3),
    "causeId" TEXT,
    "initiativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaithContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "FaithContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT,
    "videoUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "religiousReviewStatus" "ReligiousReviewStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "sourceCitation" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "causeId" TEXT,
    "initiativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FaithContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaithContentTopic" (
    "faithContentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "FaithContentTopic_pkey" PRIMARY KEY ("faithContentId", "topicId")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "title" TEXT,
    "publicUrl" TEXT,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "sourcePath" TEXT,
    "sourceYear" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "privacyApprovedAt" TIMESTAMP(3),
    "causeId" TEXT,
    "initiativeId" TEXT,
    "storyId" TEXT,
    "faithContentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cause_slug_key" ON "Cause"("slug");
CREATE INDEX "Cause_status_publishedAt_idx" ON "Cause"("status", "publishedAt");
CREATE INDEX "Cause_isFeatured_displayOrder_idx" ON "Cause"("isFeatured", "displayOrder");

CREATE UNIQUE INDEX "Initiative_slug_key" ON "Initiative"("slug");
CREATE INDEX "Initiative_causeId_status_publishedAt_idx" ON "Initiative"("causeId", "status", "publishedAt");
CREATE INDEX "Initiative_isFeatured_displayOrder_idx" ON "Initiative"("isFeatured", "displayOrder");
CREATE INDEX "Initiative_year_idx" ON "Initiative"("year");

CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");
CREATE INDEX "Story_causeId_idx" ON "Story"("causeId");
CREATE INDEX "Story_initiativeId_idx" ON "Story"("initiativeId");

CREATE UNIQUE INDEX "FaithContent_slug_key" ON "FaithContent"("slug");
CREATE INDEX "FaithContent_type_status_publishedAt_idx" ON "FaithContent"("type", "status", "publishedAt");
CREATE INDEX "FaithContent_religiousReviewStatus_idx" ON "FaithContent"("religiousReviewStatus");
CREATE INDEX "FaithContent_causeId_idx" ON "FaithContent"("causeId");
CREATE INDEX "FaithContent_initiativeId_idx" ON "FaithContent"("initiativeId");

CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");
CREATE INDEX "FaithContentTopic_topicId_idx" ON "FaithContentTopic"("topicId");

CREATE INDEX "MediaAsset_causeId_isPublic_sortOrder_idx" ON "MediaAsset"("causeId", "isPublic", "sortOrder");
CREATE INDEX "MediaAsset_initiativeId_isPublic_sortOrder_idx" ON "MediaAsset"("initiativeId", "isPublic", "sortOrder");
CREATE INDEX "MediaAsset_storyId_isPublic_sortOrder_idx" ON "MediaAsset"("storyId", "isPublic", "sortOrder");
CREATE INDEX "MediaAsset_faithContentId_isPublic_sortOrder_idx" ON "MediaAsset"("faithContentId", "isPublic", "sortOrder");

CREATE INDEX "Appeal_causeId_idx" ON "Appeal"("causeId");
CREATE INDEX "Appeal_initiativeId_idx" ON "Appeal"("initiativeId");

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FaithContent" ADD CONSTRAINT "FaithContent_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FaithContent" ADD CONSTRAINT "FaithContent_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FaithContentTopic" ADD CONSTRAINT "FaithContentTopic_faithContentId_fkey" FOREIGN KEY ("faithContentId") REFERENCES "FaithContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FaithContentTopic" ADD CONSTRAINT "FaithContentTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_faithContentId_fkey" FOREIGN KEY ("faithContentId") REFERENCES "FaithContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
