-- CreateEnum
CREATE TYPE "GivingFundStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PAUSED', 'CLOSED');

-- CreateTable
CREATE TABLE "GivingFund" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "disclosure" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "acceptedIntents" "DonationIntent"[],
    "status" "GivingFundStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "lastEditedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingFund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GivingFund_slug_key" ON "GivingFund"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GivingFund_accountCode_key" ON "GivingFund"("accountCode");

-- CreateIndex
CREATE INDEX "GivingFund_status_updatedAt_idx" ON "GivingFund"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "GivingFund" ADD CONSTRAINT "GivingFund_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GivingFund" ADD CONSTRAINT "GivingFund_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GivingFund" ADD CONSTRAINT "GivingFund_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Definitions are private and fail closed; no active fund is seeded and no
-- existing Donation, payment, refund or appeal relation is altered.
ALTER TABLE "GivingFund"
  ALTER COLUMN "acceptedIntents" SET NOT NULL,
  ADD CONSTRAINT "GivingFund_currency_check" CHECK ("currency" = 'INR'),
  ADD CONSTRAINT "GivingFund_revision_check" CHECK ("revision" >= 0),
  ADD CONSTRAINT "GivingFund_intents_check" CHECK (
    "acceptedIntents" = ARRAY['GENERAL']::"DonationIntent"[] OR
    "acceptedIntents" = ARRAY['SADAQAH']::"DonationIntent"[] OR
    "acceptedIntents" = ARRAY['GENERAL', 'SADAQAH']::"DonationIntent"[]
  ),
  ADD CONSTRAINT "GivingFund_approval_check" CHECK (
    ("status" IN ('DRAFT', 'UNDER_REVIEW') AND "approvedById" IS NULL AND "approvedAt" IS NULL) OR
    ("status" IN ('APPROVED', 'PAUSED', 'CLOSED') AND "approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL)
  ),
  ADD CONSTRAINT "GivingFund_independent_approver_check" CHECK (
    "approvedById" IS NULL OR ("approvedById" <> "createdById" AND "approvedById" <> "lastEditedById")
  );

INSERT INTO "Permission" ("id", "key", "description", "createdAt") VALUES
  ('perm_fund_view_20261014', 'fund.view', 'View private giving fund definitions', CURRENT_TIMESTAMP),
  ('perm_fund_manage_20261014', 'fund.manage', 'Create and edit draft giving fund definitions', CURRENT_TIMESTAMP),
  ('perm_fund_approve_20261014', 'fund.approve', 'Independently approve, pause or close giving fund definitions', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id" FROM "Role" role
JOIN "Permission" permission ON permission."key" IN ('fund.view', 'fund.manage', 'fund.approve')
WHERE role."name" IN ('PRIMARY_APPROVER', 'BACKUP_APPROVER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id" FROM "Role" role
JOIN "Permission" permission ON permission."key" IN ('fund.view', 'fund.manage')
WHERE role."name" = 'REVIEWER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
