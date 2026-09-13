import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { importReviewedCampaigns } from "./reviewed-campaign-import.mjs";

// This rollout is explicitly preview-only. Existing records are never overwritten.
if (process.env.RAILWAY_PUBLIC_DOMAIN !== "amaana-rebuild-preview-production.up.railway.app") {
  console.log("Reviewed campaign import skipped outside the designated preview.");
} else {
  const campaigns = JSON.parse(await readFile(new URL("./campaigns-2026.json", import.meta.url), "utf8"));
  const prisma = new PrismaClient();
  try {
    const created = await importReviewedCampaigns(prisma, campaigns);
    console.log(`Reviewed campaign import: ${created} new editions; existing records preserved.`);
  } finally {
    await prisma.$disconnect();
  }
}
