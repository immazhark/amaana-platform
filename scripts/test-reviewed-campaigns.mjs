import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importReviewedCampaigns } from "../prisma/reviewed-campaign-import.mjs";

const campaigns = JSON.parse(await readFile(new URL("../prisma/campaigns-2026.json", import.meta.url), "utf8"));
function database({ cause = "PUBLISHED", existing = [] } = {}) {
  const records = new Map(existing.map(slug => [slug, { id: slug, status: "ARCHIVED" }]));
  const writes = [];
  const tx = {
    $executeRaw: async () => 1,
    cause: {
      findUnique: async () => cause ? { id: "seasonal-cause", status: cause } : null,
      create: async ({ data }) => ({ id: "seasonal-cause", ...data }),
    },
    initiative: {
      findUnique: async ({ where }) => records.get(where.slug) ?? null,
      create: async ({ data }) => { writes.push(data); records.set(data.slug, { id: data.slug, ...data }); },
    },
  };
  return { prisma: { $transaction: async callback => callback(tx) }, records, writes };
}
test("creates both editions with reviewed media associated to their initiative", async () => {
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 2);
  for (const row of db.writes) {
    assert.equal(row.year, 2026);
    assert.equal(row.causeId, "seasonal-cause");
    assert.equal(row.mediaAssets.create.length, 3);
    assert.ok(row.mediaAssets.create.every(asset => asset.isPublic && asset.privacyApprovedAt && asset.altText && asset.publicUrl.startsWith("/media/")));
  }
});
test("repeated startup does not overwrite editorial records or duplicate media", async () => {
  const db = database();
  await importReviewedCampaigns(db.prisma, campaigns);
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 0);
  assert.equal(db.writes.length, 2);
});
test("an existing archived record remains archived and untouched", async () => {
  const slug = campaigns[0].slug;
  const db = database({ existing: [slug] });
  await importReviewedCampaigns(db.prisma, campaigns);
  assert.equal(db.records.get(slug).status, "ARCHIVED");
  assert.equal(db.writes.length, 1);
});
test("missing cause is created without depending on a destructive seed", async () => {
  const db = database({ cause: false });
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 2);
  assert.ok(db.writes.every(row => row.causeId === "seasonal-cause"));
});
test("an unpublished cause is not silently republished", async () => {
  const db = database({ cause: "ARCHIVED" });
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 0);
  assert.equal(db.writes.length, 0);
});
test("campaign media identifiers and URLs are unique within this import", () => {
  const media = campaigns.flatMap(campaign => campaign.media);
  assert.equal(new Set(media.map(asset => asset.id)).size, media.length);
  assert.equal(new Set(media.map(asset => asset.url)).size, media.length);
});
test("historical education edition uses its own cause and media year", async () => {
  const historical = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
  const db = database();
  await importReviewedCampaigns(db.prisma, historical);
  assert.equal(db.writes[0].year, 2025);
  assert.ok(db.writes[0].mediaAssets.create.every(asset => asset.sourceYear === 2025));
  assert.equal(db.writes[0].cause, undefined);
});
test("multi-year archive edition uses its starting year for media provenance", async () => {
  const historical = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
  const winter = historical.filter(campaign => campaign.slug === "winter-drive-2025-26");
  const db = database();
  await importReviewedCampaigns(db.prisma, winter);
  assert.equal(db.writes[0].startYear, 2025);
  assert.equal(db.writes[0].endYear, 2026);
  assert.ok(db.writes[0].mediaAssets.create.every(asset => asset.sourceYear === 2025));
  assert.equal(db.writes[0].mediaAssets.create.length, 4);
  assert.ok(db.writes[0].mediaAssets.create.slice(0, 2).every(asset => asset.sourcePath.startsWith("user-upload:winter-2025-26/")));
});
test("historical dates editions preserve reported weights and video media kinds", async () => {
  const historical = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
  const dates = historical.filter(campaign => campaign.slug.startsWith("dates-distribution-"));
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, dates), 3);
  assert.deepEqual(db.writes.map(row => row.year), [2025, 2024, 2023]);
  assert.deepEqual(db.writes.map(row => row.primaryMetric), ["90 kg", "90 kg", "78 kg"]);
  assert.equal(db.writes.find(row => row.year === 2024).mediaAssets.create.at(-1).kind, "VIDEO");
  assert.equal(db.writes.find(row => row.year === 2023).mediaAssets.create.at(-1).kind, "VIDEO");
});
test("meat distribution editions preserve reported family reach and local media", async () => {
  const historical = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
  const meat = historical.filter(campaign => campaign.slug.startsWith("meat-distribution-"));
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, meat), 2);
  assert.deepEqual(db.writes.map(row => row.primaryMetric), ["350 families", "150+ families"]);
  assert.ok(db.writes.flatMap(row => row.mediaAssets.create).every(asset => asset.sourcePath.startsWith("user-upload:meat-")));
});
