-- CreateEnum
CREATE TYPE "AssistanceVerificationDecision" AS ENUM ('PENDING', 'APPROVED_PUBLIC', 'APPROVED_PRIVATE', 'APPROVED_PARTIAL', 'REFERRED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ConsentDecision" AS ENUM ('UNCONFIRMED', 'ALLOWED', 'NOT_ALLOWED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ZakatReviewStatus" AS ENUM ('UNREVIEWED', 'ELIGIBLE', 'NOT_ELIGIBLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('STANDARD', 'CONFIDENTIAL', 'HIGHLY_SENSITIVE');

-- CreateTable
CREATE TABLE "AssistanceVerification" (
    "id" TEXT NOT NULL,
    "assistanceRequestId" TEXT NOT NULL,
    "needConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "evidenceReviewed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedNeedAmount" DECIMAL(12,2),
    "approvedPublicTarget" DECIMAL(12,2),
    "paymentDestination" TEXT,
    "otherFundingChecked" BOOLEAN NOT NULL DEFAULT false,
    "otherFundingNotes" TEXT,
    "verificationSummary" TEXT,
    "decision" "AssistanceVerificationDecision" NOT NULL DEFAULT 'PENDING',
    "confidentialityLevel" "ConfidentialityLevel" NOT NULL DEFAULT 'CONFIDENTIAL',
    "publicNameConsent" "ConsentDecision" NOT NULL DEFAULT 'UNCONFIRMED',
    "photoConsent" "ConsentDecision" NOT NULL DEFAULT 'UNCONFIRMED',
    "medicalDetailsConsent" "ConsentDecision" NOT NULL DEFAULT 'UNCONFIRMED',
    "institutionNameConsent" "ConsentDecision" NOT NULL DEFAULT 'UNCONFIRMED',
    "archiveConsent" "ConsentDecision" NOT NULL DEFAULT 'UNCONFIRMED',
    "zakatStatus" "ZakatReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "reviewedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistanceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistanceVerification_assistanceRequestId_key" ON "AssistanceVerification"("assistanceRequestId");
CREATE INDEX "AssistanceVerification_decision_completedAt_idx" ON "AssistanceVerification"("decision", "completedAt");
CREATE INDEX "AssistanceVerification_reviewedById_idx" ON "AssistanceVerification"("reviewedById");

-- AddForeignKey
ALTER TABLE "AssistanceVerification" ADD CONSTRAINT "AssistanceVerification_assistanceRequestId_fkey" FOREIGN KEY ("assistanceRequestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistanceVerification" ADD CONSTRAINT "AssistanceVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
