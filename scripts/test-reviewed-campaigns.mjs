import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importReviewedCampaigns, isReviewedCampaignImportTarget } from "../prisma/reviewed-campaign-import.mjs";

const campaigns = JSON.parse(await readFile(new URL("../prisma/campaigns-2026.json", import.meta.url), "utf8"));
const historical = JSON.parse(await readFile(new URL("../prisma/campaigns-archive.json", import.meta.url), "utf8"));
const CANONICAL_CAUSE_SLUGS = new Set([
  "medical-financial-relief",
  "emergency-humanitarian-relief",
  "ramadan-eid",
  "amaana-taleem",
  "seasonal-relief",
]);

function database({
  causeStatus = "PUBLISHED",
  causeStatuses = {},
  existing = [],
} = {}) {
  const records = new Map(existing.map(slug => [slug, { id: slug, status: "ARCHIVED" }]));
  const writes = [];
  const causeLookups = [];
  const tx = {
    $executeRaw: async () => 1,
    cause: {
      findUnique: async ({ where }) => {
        causeLookups.push(where.slug);
        const status = Object.prototype.hasOwnProperty.call(causeStatuses, where.slug)
          ? causeStatuses[where.slug]
          : causeStatus;
        return status ? { id: `cause:${where.slug}`, status, slug: where.slug } : null;
      },
      create: async () => {
        throw new Error("Reviewed campaign import must not create Causes");
      },
    },
    initiative: {
      findUnique: async ({ where }) => records.get(where.slug) ?? null,
      create: async ({ data }) => {
        writes.push(data);
        records.set(data.slug, { id: data.slug, ...data });
      },
    },
  };

  return {
    prisma: { $transaction: async callback => callback(tx) },
    records,
    writes,
    causeLookups,
  };
}

test("reviewed campaign bootstrap targets only the designated staging preview service", () => {
  const serviceId = "fcb9d167-eba1-40c8-a4e6-ac35af470989";
  assert.equal(isReviewedCampaignImportTarget({
    APP_ENVIRONMENT: "staging",
    RAILWAY_SERVICE_ID: serviceId,
    RAILWAY_PUBLIC_DOMAIN: "amaanafoundation.org",
  }), true);
  assert.equal(isReviewedCampaignImportTarget({
    APP_ENVIRONMENT: "production",
    RAILWAY_SERVICE_ID: serviceId,
  }), false);
  assert.equal(isReviewedCampaignImportTarget({
    APP_ENVIRONMENT: "staging",
    RAILWAY_SERVICE_ID: "another-service",
    RAILWAY_PUBLIC_DOMAIN: "amaana-rebuild-preview-production.up.railway.app",
  }), false);
});

test("reviewed campaign sources use only explicit canonical causes", () => {
  for (const campaign of [...campaigns, ...historical]) {
    assert.ok(campaign.cause?.slug, `${campaign.slug} is missing an explicit cause`);
    assert.ok(
      CANONICAL_CAUSE_SLUGS.has(campaign.cause.slug),
      `${campaign.slug} uses noncanonical cause ${campaign.cause.slug}`,
    );
  }
});

test("creates both 2026 editions under canonical Ramadan/Eid", async () => {
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 2);
  assert.deepEqual(db.causeLookups, ["ramadan-eid"]);
  for (const row of db.writes) {
    assert.equal(row.year, 2026);
    assert.equal(row.causeId, "cause:ramadan-eid");
    assert.equal(row.mediaAssets.create.length, 3);
    assert.ok(row.mediaAssets.create.every(
      asset => asset.isPublic
        && asset.privacyApprovedAt
        && asset.altText
        && asset.publicUrl.startsWith("/media/"),
    ));
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

test("a missing canonical cause fails closed instead of creating alternate taxonomy", async () => {
  const db = database({ causeStatuses: { "ramadan-eid": null } });
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 0);
  assert.equal(db.writes.length, 0);
});

test("an unpublished canonical cause is not silently republished", async () => {
  const db = database({ causeStatuses: { "ramadan-eid": "ARCHIVED" } });
  assert.equal(await importReviewedCampaigns(db.prisma, campaigns), 0);
  assert.equal(db.writes.length, 0);
});

test("one unpublished cause does not block campaigns in another canonical cause", async () => {
  const aid = historical.find(campaign => campaign.slug === "medical-aid-eight-day-old-baby");
  const db = database({ causeStatuses: { "ramadan-eid": "ARCHIVED" } });
  assert.equal(await importReviewedCampaigns(db.prisma, [campaigns[0], aid]), 1);
  assert.equal(db.writes.length, 1);
  assert.equal(db.writes[0].slug, aid.slug);
  assert.equal(db.writes[0].causeId, "cause:medical-financial-relief");
});

test("noncanonical cause input is rejected before it can publish taxonomy", async () => {
  const db = database();
  const invalid = {
    ...campaigns[0],
    cause: { slug: "seasonal-food-support" },
  };
  await assert.rejects(
    importReviewedCampaigns(db.prisma, [invalid]),
    /uses noncanonical cause seasonal-food-support/,
  );
  assert.equal(db.writes.length, 0);
});

test("campaign media identifiers and URLs are unique within this import", () => {
  const media = campaigns.flatMap(campaign => campaign.media);
  assert.equal(new Set(media.map(asset => asset.id)).size, media.length);
  assert.equal(new Set(media.map(asset => asset.url)).size, media.length);
});

test("historical education edition uses canonical Taleem cause and media year", async () => {
  const db = database();
  await importReviewedCampaigns(db.prisma, historical);
  const taleem = db.writes.find(row => row.slug === "taleem-initiative-2025");
  assert.equal(taleem.year, 2025);
  assert.equal(taleem.causeId, "cause:amaana-taleem");
  assert.ok(taleem.mediaAssets.create.every(asset => asset.sourceYear === 2025));
  assert.equal(taleem.cause, undefined);
});

test("multi-year Winter archive uses canonical Seasonal Relief and starting-year provenance", async () => {
  const winter = historical.filter(campaign => campaign.slug === "winter-drive-2025-26");
  const db = database();
  await importReviewedCampaigns(db.prisma, winter);
  assert.equal(db.writes[0].startYear, 2025);
  assert.equal(db.writes[0].endYear, 2026);
  assert.equal(db.writes[0].causeId, "cause:seasonal-relief");
  assert.ok(db.writes[0].mediaAssets.create.every(asset => asset.sourceYear === 2025));
  assert.equal(db.writes[0].mediaAssets.create.length, 4);
  assert.ok(db.writes[0].mediaAssets.create.slice(0, 2).every(
    asset => asset.sourcePath.startsWith("user-upload:winter-2025-26/"),
  ));
});

test("historical dates editions preserve reported weights and canonical Ramadan/Eid", async () => {
  const dates = historical.filter(campaign => campaign.slug.startsWith("dates-distribution-"));
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, dates), 3);
  assert.deepEqual(db.writes.map(row => row.year), [2025, 2024, 2023]);
  assert.deepEqual(db.writes.map(row => row.primaryMetric), ["90 kg", "90 kg", "78 kg"]);
  assert.ok(db.writes.every(row => row.causeId === "cause:ramadan-eid"));
  assert.equal(db.writes.find(row => row.year === 2024).mediaAssets.create.at(-1).kind, "VIDEO");
  assert.equal(db.writes.find(row => row.year === 2023).mediaAssets.create.at(-1).kind, "VIDEO");
});

test("meat distribution editions preserve reported family reach and canonical Ramadan/Eid", async () => {
  const meat = historical.filter(campaign => campaign.slug.startsWith("meat-distribution-"));
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, meat), 2);
  assert.deepEqual(db.writes.map(row => row.primaryMetric), ["350 families", "150 families"]);
  assert.ok(db.writes.every(row => row.causeId === "cause:ramadan-eid"));
  assert.ok(db.writes.flatMap(row => row.mediaAssets.create).every(
    asset => asset.sourcePath.startsWith("user-upload:meat-"),
  ));
});

test("completed aid appeals preserve exact amounts under canonical Medical & Financial Relief", async () => {
  const aid = historical.filter(campaign => campaign.cause?.slug === "medical-financial-relief");
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, aid), 5);
  assert.deepEqual(
    db.writes.map(row => row.primaryMetric),
    ["₹95,000", "₹1,07,520", "₹3,19,000", "₹72,000", "₹4,82,700"],
  );
  assert.ok(db.writes.every(row => row.causeId === "cause:medical-financial-relief"));
  assert.ok(db.writes.flatMap(row => row.mediaAssets.create).every(
    asset => asset.sourcePath.startsWith("user-upload:"),
  ));
});

test("completed aid archive excludes live payment cards and marks privacy derivatives", () => {
  const aid = historical.filter(campaign => campaign.cause?.slug === "medical-financial-relief");
  const sources = aid.flatMap(campaign => campaign.media.map(asset => asset.source));
  assert.ok(!sources.some(source => source.includes("3 (2).png")));
  assert.ok(sources.some(source => source.includes("payment-details-omitted")));
  assert.ok(sources.some(source => source.includes("faces-blurred")));
  assert.ok(sources.some(source => source.includes("contact-details-redacted")));
});

test("Eid Gift Kits archive preserves all seven editions under canonical Ramadan/Eid", async () => {
  const eid = historical.filter(campaign => campaign.slug.startsWith("eid-gift-kits-"));
  const db = database();
  assert.equal(await importReviewedCampaigns(db.prisma, eid), 7);
  assert.deepEqual(db.writes.map(row => row.year), [2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  assert.deepEqual(
    db.writes.map(row => row.primaryMetric ?? null),
    ["85 families", "171 kits", "339 kits", "408 kits", "467 kits", "650 kits", "710 families"],
  );
  assert.ok(db.writes.every(row => row.causeId === "cause:ramadan-eid"));
  assert.ok(db.writes.flatMap(row => row.mediaAssets.create).every(
    asset => asset.sourcePath.startsWith("user-upload:eid-kits-"),
  ));
  assert.deepEqual(db.writes.map(row => row.mediaAssets.create.length), [16, 17, 24, 19, 8, 8, 13]);
  assert.equal(db.writes.flatMap(row => row.mediaAssets.create).length, 105);
});

test("Eid Gift Kits archive uses canonical totals and campaign-reported labels", () => {
  const eid = historical.filter(campaign => campaign.slug.startsWith("eid-gift-kits-"));
  assert.equal(eid.find(campaign => campaign.year === 2023).primaryMetric, "408 kits");
  assert.ok(eid.filter(campaign => campaign.primaryMetric).every(
    campaign => campaign.primaryMetricLabel.includes("campaign-reported"),
  ));
  const media = eid.flatMap(campaign => campaign.media);
  assert.equal(new Set(media.map(asset => asset.id)).size, media.length);
  assert.equal(new Set(media.map(asset => asset.url)).size, media.length);
});
