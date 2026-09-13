import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyReviewedCampaignRevisions } from "../prisma/reviewed-campaign-revisions.mjs";
const revisions = JSON.parse(await readFile(new URL("../prisma/campaign-revisions.json", import.meta.url), "utf8"));
function database({ summary = revisions[0].expectedSummary, status = "PUBLISHED", existing = [] } = {}) {
  const media = new Set(existing), writes = [], updates = [];
  const tx = { $executeRaw: async () => 1,
    initiative: { findUnique: async () => summary === null ? null : ({ id: "taleem", status, summary }), update: async ({ data }) => updates.push(data) },
    mediaAsset: { findFirst: async ({ where }) => media.has(where.sourcePath) ? { id: where.sourcePath } : null, create: async ({ data }) => { writes.push(data); media.add(data.sourcePath); } },
  };
  return { prisma: { $transaction: async callback => callback(tx) }, writes, updates };
}
test("adds three reviewed images and revises only the expected authored record", async () => {
  const db = database();
  assert.equal(await applyReviewedCampaignRevisions(db.prisma, revisions), 1);
  assert.equal(db.writes.length, 3); assert.equal(db.updates.length, 1);
  assert.deepEqual(db.writes.map(row => row.sortOrder), [-10, -9, -8]);
  assert.ok(db.writes.every(row => row.isPublic && row.privacyApprovedAt && row.publicUrl.startsWith("/media/")));
});
test("does not revise edited, missing or unpublished records", async () => {
  for (const db of [database({ summary: "editor changed this" }), database({ summary: null }), database({ status: "ARCHIVED" })]) {
    assert.equal(await applyReviewedCampaignRevisions(db.prisma, revisions), 0); assert.equal(db.writes.length, 0);
  }
});
test("rerun does not duplicate media", async () => {
  const db = database({ existing: revisions[0].media.map(asset => asset.source) });
  await applyReviewedCampaignRevisions(db.prisma, revisions); assert.equal(db.writes.length, 0);
});
