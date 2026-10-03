import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { importReviewedCampaigns, isReviewedCampaignImportTarget } from "./reviewed-campaign-import.mjs";
import { applyReviewedCampaignRevisions } from "./reviewed-campaign-revisions.mjs";
import { applyMasterContent } from "./apply-master-content.mjs";

// This rollout is explicitly preview-only. Existing records are never overwritten.
if (!isReviewedCampaignImportTarget(process.env)) {
  console.log("Reviewed campaign import skipped outside the designated preview staging service.");
} else {
  const campaigns = (await Promise.all(["./campaigns-2026.json", "./campaigns-archive.json"].map(async filename => JSON.parse(await readFile(new URL(filename, import.meta.url), "utf8"))))).flat();
  const prisma = new PrismaClient();
  try {
    const canonical = await applyMasterContent(prisma);
    const created = await importReviewedCampaigns(prisma, campaigns);
    const revisions = JSON.parse(await readFile(new URL("./campaign-revisions.json", import.meta.url), "utf8"));
    const revised = await applyReviewedCampaignRevisions(prisma, revisions, campaigns);
    console.log(`Canonical content migration: ${canonical} programme records.`);
    console.log(`Reviewed campaign import: ${created} new editions; ${revised} source-guarded revisions.`);
  } finally {
    await prisma.$disconnect();
  }
}

