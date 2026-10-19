CREATE TABLE "TeamGroup" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "bio" TEXT,
  "photoStorageKey" TEXT,
  "photoAlt" TEXT,
  "photoWidth" INTEGER,
  "photoHeight" INTEGER,
  "photoConsentAt" TIMESTAMP(3),
  "linkedinUrl" TEXT,
  "email" TEXT,
  "groupId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamGroup_key_key" ON "TeamGroup"("key");
CREATE INDEX "TeamGroup_sortOrder_id_idx" ON "TeamGroup"("sortOrder", "id");
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");
CREATE INDEX "TeamMember_groupId_isPublished_sortOrder_idx" ON "TeamMember"("groupId", "isPublished", "sortOrder");
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "TeamGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
