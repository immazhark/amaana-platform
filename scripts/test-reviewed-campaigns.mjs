import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importReviewedCampaigns } from "../prisma/reviewed-campaign-import.mjs";

const campaigns = JSON.parse(await readFile(new URL("../prisma/campaigns-2026.json", import.meta.url), "utf8"));
function database({ cause = true, existing = [] } = {}) {
  const records = new Map(existing.map(slug => [slug, { id: slug, status: "ARCHIVED" }]));
  const writes = [];
  const tx = {
    $executeRaw: async () => 1,
    cause: { findFirst: async () => cause ? { id: "seasonal-cause" } : null },
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
test("missing public cause fails without creating orphan campaigns", async () => {
  const db = database({ cause: false });
  await assert.rejects(importReviewedCampaigns(db.prisma, campaigns), /Published seasonal/);
  assert.equal(db.writes.length, 0);
});
test("campaign media identifiers and URLs are unique within this import", () => {
  const media = campaigns.flatMap(campaign => campaign.media);
  assert.equal(new Set(media.map(asset => asset.id)).size, media.length);
  assert.equal(new Set(media.map(asset => asset.url)).size, media.length);
});
