import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STAGING_SLUG = "staging-checkout-acceptance";

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
      goalAmount: "1000.00",
      isFeatured: false,
      publishedAt: new Date(),
      closesAt: null,
      createdById: owner.id,
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
      publishedAt: new Date(),
      createdById: owner.id,
    },
    select: { slug: true, status: true },
  });

  console.log(`Staging acceptance appeal ready: ${appeal.slug} (${appeal.status})`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
