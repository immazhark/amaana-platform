import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyReviewedCampaignRevisions } from "../prisma/reviewed-campaign-revisions.mjs";
const revisions = JSON.parse(await readFile(new URL("../prisma/campaign-revisions.json", import.meta.url), "utf8"));
const archive = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
const taleem = revisions.find(revision => revision.slug === "taleem-initiative-2025");
const dates = revisions.find(revision => revision.slug === "dates-distribution-2026");
const dates2023 = revisions.find(revision => revision.slug === "dates-distribution-2023");
const meat2025 = revisions.find(revision => revision.slug === "meat-distribution-2025");
function database({ revision = taleem, summary = revision.expectedSummary, status = "PUBLISHED", existing = [] } = {}) {
  const media = new Set(existing), writes = [], updates = [], deletions = [];
  const tx = { $executeRaw: async () => 1,
    initiative: { findUnique: async () => summary === null ? null : ({ id: "taleem", status, summary }), update: async ({ data }) => updates.push(data) },
    mediaAsset: { findFirst: async ({ where }) => media.has(where.sourcePath) ? { id: where.sourcePath } : null, count: async ({ where }) => where.sourcePath.in.filter(source => media.has(source)).length, create: async ({ data }) => { writes.push(data); media.add(data.sourcePath); }, deleteMany: async ({ where }) => { deletions.push(where); media.clear(); } },
  };
  return { prisma: { $transaction: async callback => callback(tx) }, writes, updates, deletions };
}
test("adds three reviewed images and revises only the expected authored record", async () => {
  const db = database();
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [taleem]), 1);
  assert.equal(db.writes.length, 3); assert.equal(db.updates.length, 1);
  assert.deepEqual(db.writes.map(row => row.sortOrder), [-10, -9, -8]);
  assert.ok(db.writes.every(row => row.isPublic && row.privacyApprovedAt && row.publicUrl.startsWith("/media/")));
});
test("does not revise edited, missing or unpublished records", async () => {
  for (const db of [database({ summary: "editor changed this" }), database({ summary: null }), database({ status: "ARCHIVED" })]) {
    assert.equal(await applyReviewedCampaignRevisions(db.prisma, [taleem]), 0); assert.equal(db.writes.length, 0);
  }
});
test("rerun does not duplicate media", async () => {
  const db = database({ existing: taleem.media.map(asset => asset.source) });
  await applyReviewedCampaignRevisions(db.prisma, [taleem]); assert.equal(db.writes.length, 0);
});
test("dates revision adds images and one preparation video with 2026 provenance", async () => {
  const db = database({ revision: dates });
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [dates]), 1);
  assert.equal(db.writes.length, 11);
  assert.equal(db.writes.filter(row => row.kind === "VIDEO").length, 1);
  assert.ok(db.writes.every(row => row.sourceYear === 2026 && row.sourcePath.startsWith("user-upload:dates-2026/")));
});
test("dates 2023 correction updates the reported weight without adding media", async () => {
  const db = database({ revision: dates2023 });
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [dates2023]), 1);
  assert.equal(db.writes.length, 0);
  assert.equal(db.updates[0].primaryMetric, "78 kg");
});
test("meat 2025 correction follows the user-provided family count", async () => {
  const db = database({ revision: meat2025 });
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [meat2025]), 1);
  assert.equal(db.writes.length, 0);
  assert.equal(db.updates[0].primaryMetric, "150 families");
});
test("Eid revisions replace only the source-guarded gallery with the complete campaign selection", async () => {
  const revision = revisions.find(item => item.slug === "eid-gift-kits-2024");
  const campaign = archive.find(item => item.slug === revision.slug);
  const db = database({ revision, existing: ["legacy-eid-photo"] });
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [revision], archive), 1);
  assert.equal(db.deletions.length, 1);
  assert.equal(db.writes.length, 8);
  assert.deepEqual(db.writes.map(row => row.sortOrder), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(db.writes.every(row => row.sourceYear === 2024));
  assert.equal(db.updates[0].summary, campaign.summary);
});
test("completed Eid gallery replacement is idempotent", async () => {
  const revision = revisions.find(item => item.slug === "eid-gift-kits-2024");
  const campaign = archive.find(item => item.slug === revision.slug);
  const db = database({ revision, existing: campaign.media.map(asset => asset.source) });
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, [revision], archive), 0);
  assert.equal(db.deletions.length, 0);
  assert.equal(db.writes.length, 0);
  assert.equal(db.updates.length, 0);
});

