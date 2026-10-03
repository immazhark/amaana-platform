import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReviewedCampaignFeaturing } from "../prisma/reviewed-campaign-feature-normalization.mjs";

function database(records) {
  const rows = new Map(records.map(row => [row.slug, { ...row }]));
  const updates = [];
  const tx = {
    $executeRaw: async () => 1,
    initiative: {
      findUnique: async ({ where }) => rows.get(where.slug) ?? null,
      update: async ({ where, data }) => {
        const current = [...rows.values()].find(row => row.id === where.id);
        Object.assign(current, data);
        updates.push({ id: where.id, data });
        return current;
      },
    },
  };
  return { prisma: { $transaction: async callback => callback(tx) }, rows, updates };
}

test("source-matching reviewed editions are removed from featured slots", async () => {
  const db = database([{ id: "1", slug: "eid-gift-kits-2025", status: "PUBLISHED", summary: "reviewed summary", isFeatured: true }]);
  const changed = await normalizeReviewedCampaignFeaturing(db.prisma, [{ slug: "eid-gift-kits-2025", summary: "reviewed summary" }]);
  assert.equal(changed, 1);
  assert.equal(db.rows.get("eid-gift-kits-2025").isFeatured, false);
});

test("editorially changed records are never normalized by the startup guard", async () => {
  const db = database([{ id: "1", slug: "eid-gift-kits-2025", status: "PUBLISHED", summary: "editor changed this", isFeatured: true }]);
  const changed = await normalizeReviewedCampaignFeaturing(db.prisma, [{ slug: "eid-gift-kits-2025", summary: "reviewed summary" }]);
  assert.equal(changed, 0);
  assert.equal(db.rows.get("eid-gift-kits-2025").isFeatured, true);
  assert.equal(db.updates.length, 0);
});

test("explicitly featured reviewed records remain featured", async () => {
  const db = database([{ id: "1", slug: "special-edition", status: "PUBLISHED", summary: "reviewed summary", isFeatured: true }]);
  const changed = await normalizeReviewedCampaignFeaturing(db.prisma, [{ slug: "special-edition", summary: "reviewed summary", isFeatured: true }]);
  assert.equal(changed, 0);
  assert.equal(db.rows.get("special-edition").isFeatured, true);
});

test("archived records remain untouched", async () => {
  const db = database([{ id: "1", slug: "eid-gift-kits-2024", status: "ARCHIVED", summary: "reviewed summary", isFeatured: true }]);
  const changed = await normalizeReviewedCampaignFeaturing(db.prisma, [{ slug: "eid-gift-kits-2024", summary: "reviewed summary" }]);
  assert.equal(changed, 0);
  assert.equal(db.rows.get("eid-gift-kits-2024").isFeatured, true);
});
