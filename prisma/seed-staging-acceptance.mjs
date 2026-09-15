import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STAGING_SLUG = "staging-checkout-acceptance";
const STAGING_REFERENCE = "AF-STAGING-ACCEPTANCE";
const SYNTHETIC_TRACKING_TOKEN = "staging-acceptance-only";

async function main() {
  if (process.env.APP_ENVIRONMENT !== "staging") {
    throw new Error("Refusing to seed staging acceptance data outside APP_ENVIRONMENT=staging");
  }

  const adminEmail = process.env.ADMIN_MAZHAR_EMAIL;
  if (!adminEmail) throw new Error("ADMIN_MAZHAR_EMAIL is required for staging acceptance seed ownership");

  const owner = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (!owner) throw new Error("Staging acceptance seed owner is not present in the database");

  const now = new Date();
  const trackingTokenHash = createHash("sha256").update(SYNTHETIC_TRACKING_TOKEN).digest("hex");

  const request = await prisma.assistanceRequest.upsert({
    where: { referenceNumber: STAGING_REFERENCE },
    update: {
      applicantName: "Synthetic staging applicant",
      email: "staging-acceptance@example.invalid",
      phone: "+910000000000",
      city: "Hyderabad",
      category: "OTHER",
      description: "Synthetic staging-only assistance request used to verify the review-to-appeal workflow without using real beneficiary information.",
      consentGivenAt: now,
      trackingTokenHash,
      status: "APPROVED",
      assignedToId: owner.id,
      internalNotes: "Synthetic fixture. Never treat as a real beneficiary request.",
    },
    create: {
      referenceNumber: STAGING_REFERENCE,
      applicantName: "Synthetic staging applicant",
      email: "staging-acceptance@example.invalid",
      phone: "+910000000000",
      city: "Hyderabad",
      category: "OTHER",
      description: "Synthetic staging-only assistance request used to verify the review-to-appeal workflow without using real beneficiary information.",
      consentGivenAt: now,
      trackingTokenHash,
      status: "APPROVED",
      assignedToId: owner.id,
      internalNotes: "Synthetic fixture. Never treat as a real beneficiary request.",
    },
    select: { id: true, referenceNumber: true },
  });

  await prisma.assistanceVerification.upsert({
    where: { assistanceRequestId: request.id },
    update: {
      needConfirmed: true,
      evidenceReviewed: true,
      verifiedNeedAmount: "1000.00",
      approvedPublicTarget: "1000.00",
      paymentDestination: "Synthetic staging-only payment destination",
      otherFundingChecked: true,
      otherFundingNotes: "Synthetic fixture; no external fundraising exists.",
      verificationSummary: "Synthetic staging fixture approved only to exercise the verified public-appeal workflow.",
      decision: "APPROVED_PUBLIC",
      confidentialityLevel: "STANDARD",
      publicNameConsent: "ALLOWED",
      photoConsent: "NOT_APPLICABLE",
      medicalDetailsConsent: "NOT_APPLICABLE",
      institutionNameConsent: "NOT_APPLICABLE",
      archiveConsent: "ALLOWED",
      zakatStatus: "NOT_APPLICABLE",
      reviewedById: owner.id,
      completedAt: now,
    },
    create: {
      assistanceRequestId: request.id,
      needConfirmed: true,
      evidenceReviewed: true,
      verifiedNeedAmount: "1000.00",
      approvedPublicTarget: "1000.00",
      paymentDestination: "Synthetic staging-only payment destination",
      otherFundingChecked: true,
      otherFundingNotes: "Synthetic fixture; no external fundraising exists.",
      verificationSummary: "Synthetic staging fixture approved only to exercise the verified public-appeal workflow.",
      decision: "APPROVED_PUBLIC",
      confidentialityLevel: "STANDARD",
      publicNameConsent: "ALLOWED",
      photoConsent: "NOT_APPLICABLE",
      medicalDetailsConsent: "NOT_APPLICABLE",
      institutionNameConsent: "NOT_APPLICABLE",
      archiveConsent: "ALLOWED",
      zakatStatus: "NOT_APPLICABLE",
      reviewedById: owner.id,
      completedAt: now,
    },
  });

  const appeal = await prisma.appeal.upsert({
    where: { slug: STAGING_SLUG },
    update: {
      title: "STAGING TEST — Checkout acceptance",
      summary: "Synthetic staging-only appeal used to verify the donation journey. This is not a real beneficiary case.",
      story: "This record exists only in the Amaana staging environment so the team can verify appeal, checkout, payment-state and acknowledgement behavior without using real beneficiary data.",
      category: "OTHER",
      status: "PUBLISHED",
      beneficiaryName: "Synthetic staging beneficiary",
      beneficiaryDisplayName: "Staging test case",
      beneficiaryLocation: "Hyderabad, Telangana",
      coverImageUrl: null,
      goalAmount: "1000.00",
      isFeatured: false,
      publishedAt: now,
      closesAt: null,
      createdById: owner.id,
      reviewedById: owner.id,
    },
    create: {
      slug: STAGING_SLUG,
      title: "STAGING TEST — Checkout acceptance",
      summary: "Synthetic staging-only appeal used to verify the donation journey. This is not a real beneficiary case.",
      story: "This record exists only in the Amaana staging environment so the team can verify appeal, checkout, payment-state and acknowledgement behavior without using real beneficiary data.",
      category: "OTHER",
      status: "PUBLISHED",
      beneficiaryName: "Synthetic staging beneficiary",
      beneficiaryDisplayName: "Staging test case",
      beneficiaryLocation: "Hyderabad, Telangana",
      goalAmount: "1000.00",
      amountRaised: "0.00",
      isFeatured: false,
      publishedAt: now,
      createdById: owner.id,
      reviewedById: owner.id,
    },
    select: { id: true, slug: true, status: true },
  });

  await prisma.assistanceRequest.update({
    where: { id: request.id },
    data: { status: "CONVERTED_TO_APPEAL", appealId: appeal.id },
  });

  console.log(`Staging acceptance workflow ready: ${request.referenceNumber} -> ${appeal.slug} (${appeal.status})`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
