import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const locks = JSON.parse(
  await readFile(new URL('../prisma/canonical-factual-locks.json', import.meta.url), 'utf8'),
);
const masterProgrammes = JSON.parse(
  await readFile(new URL('../prisma/master-programmes.json', import.meta.url), 'utf8'),
);
const runtimeMasterCopy = JSON.parse(
  await readFile(new URL('../src/content/master-copy.json', import.meta.url), 'utf8'),
);
const migrationSource = await readFile(
  new URL('../prisma/apply-master-content.mjs', import.meta.url),
  'utf8',
);
const runtimeMasterSource = await readFile(
  new URL('../src/lib/master-copy.ts', import.meta.url),
  'utf8',
);
const convenienceContentSource = await readFile(
  new URL('../src/content/amaana.ts', import.meta.url),
  'utf8',
);
const publicSeedSource = await readFile(
  new URL('../prisma/seed-public-content.mjs', import.meta.url),
  'utf8',
);

const bySlug = new Map(locks.initiatives.map((item) => [item.slug, item]));

test('runtime and migration master programme sources stay structurally identical', () => {
  assert.equal(runtimeMasterCopy.version, masterProgrammes.version);
  assert.deepEqual(runtimeMasterCopy.categories, masterProgrammes.categories);
  assert.deepEqual(runtimeMasterCopy.initiatives, masterProgrammes.initiatives);
});

test('newborn medical-aid factual lock uses the confirmed amount', () => {
  const newborn = bySlug.get('emergency-neonatal-medical-aid');
  assert.ok(newborn);
  assert.equal(newborn.primaryMetric, '₹107,520');
  assert.deepEqual(newborn.textReplacements, [{ from: '₹107,200', to: '₹107,520' }]);
});

test('master programme source cannot reintroduce the superseded newborn amount', () => {
  const newborn = masterProgrammes.initiatives.find(
    (item) => item.slug === 'emergency-neonatal-medical-aid',
  );
  assert.ok(newborn);
  assert.equal(newborn.primaryMetric, '₹107,520');
  assert.match(newborn.summary, /₹107,520/);
  assert.match(newborn.story, /₹107,520/);
  assert.doesNotMatch(JSON.stringify(newborn), /₹107,200/);
});

test('runtime master copy matches the canonical newborn amount at source', () => {
  const newborn = runtimeMasterCopy.initiatives.find(
    (item) => item.slug === 'emergency-neonatal-medical-aid',
  );
  assert.ok(newborn);
  assert.equal(newborn.primaryMetric, '₹107,520');
  assert.match(newborn.summary, /₹107,520/);
  assert.match(newborn.story, /₹107,520/);
  assert.doesNotMatch(JSON.stringify(newborn), /₹107,200/);
});

test('Winter factual lock uses one overall 234-to-234 metric and keeps phase figures subordinate', () => {
  const winter = bySlug.get('winter-relief');
  assert.ok(winter);
  assert.equal(winter.primaryMetric, '234 Winter Kits');
  assert.equal(winter.primaryMetricLabel, 'distributed to 234 beneficiaries');
  assert.match(winter.summary, /234 Winter Kits to 234 beneficiaries/);
  assert.match(winter.story, /96 madrasa students/);
  assert.match(winter.story, /101 Winter Kits/);
  assert.match(winter.story, /must not be added to the overall total of 234/);
  assert.equal(winter.dataCaveat, null);
  assert.deepEqual(winter.legacySlugs, ['winter-drive-2025-26', 'winter-relief-2025-26']);
});

test('master Winter source matches the canonical 234-to-234 record', () => {
  const winter = masterProgrammes.initiatives.find((item) => item.slug === 'winter-relief');
  assert.ok(winter);
  assert.equal(winter.primaryMetric, '234 Winter Kits');
  assert.equal(winter.primaryMetricLabel, 'distributed to 234 beneficiaries');
  assert.match(winter.summary, /234 Winter Kits to 234 beneficiaries/);
  assert.match(winter.story, /must not be added to the overall total of 234/);
  assert.deepEqual(winter.facts, [
    'Overall: 234 Winter Kits distributed to 234 beneficiaries.',
    'Phase 1: 96 madrasa students.',
    'Phase 2: 101 Winter Kits.',
    'Phase figures are supporting sub-measures within the overall drive and must not be added to 234.',
  ]);
  assert.equal(winter.dataCaveat, null);
  assert.notEqual(winter.primaryMetric, '96 students');
});

test('runtime master copy matches the canonical Winter record at source', () => {
  const winter = runtimeMasterCopy.initiatives.find((item) => item.slug === 'winter-relief');
  assert.ok(winter);
  assert.equal(winter.primaryMetric, '234 Winter Kits');
  assert.equal(winter.primaryMetricLabel, 'distributed to 234 beneficiaries');
  assert.match(winter.summary, /234 Winter Kits to 234 beneficiaries/);
  assert.match(winter.story, /must not be added to the overall total of 234/);
  assert.deepEqual(winter.facts, [
    'Overall: 234 Winter Kits distributed to 234 beneficiaries.',
    'Phase 1: 96 madrasa students.',
    'Phase 2: 101 Winter Kits.',
    'Phase figures are supporting sub-measures within the overall drive and must not be added to 234.',
  ]);
  assert.equal(winter.dataCaveat, null);
});

test('canonical migration reapplies factual locks even when master content is already seeded', () => {
  assert.match(
    migrationSource,
    /if \(marker\?\.financialSummary\?\.contentVersion === master\.version\) \{[\s\S]*?applyCanonicalFactualLocks\(tx, factualLocks\);[\s\S]*?return 0;/,
  );
  assert.match(migrationSource, /await applyCanonicalFactualLocks\(tx, factualLocks\);/);
});

test('runtime programme copy applies the same factual-lock source before rendering', () => {
  assert.match(runtimeMasterSource, /canonical-factual-locks\.json/);
  assert.match(runtimeMasterSource, /textReplacements/);
  assert.match(runtimeMasterSource, /lockBySlug\.get\(item\.slug\)/);
});

test('convenience Winter content does not reintroduce the superseded 234+ wording', () => {
  assert.match(convenienceContentSource, /distributed 234 Winter Kits to 234 beneficiaries/);
  assert.doesNotMatch(convenienceContentSource, /234\+.*campaign-reported beneficiaries/);
});

test('convenience initiative copy uses the canonical medical-relief destination', () => {
  assert.match(convenienceContentSource, /slug: "medical-financial-relief"/);
  assert.match(convenienceContentSource, /title: "Medical & Financial Relief"/);
  assert.match(convenienceContentSource, /href: "\/programmes\/medical-financial-relief"/);
  assert.doesNotMatch(convenienceContentSource, /medical-financial-assistance/);
});

test('public-content seed uses canonical programme taxonomy and Winter facts', () => {
  assert.match(publicSeedSource, /slug: "medical-financial-relief"/);
  assert.match(publicSeedSource, /slug: "emergency-humanitarian-relief"/);
  assert.match(publicSeedSource, /slug: "ramadan-eid"/);
  assert.match(publicSeedSource, /slug: "amaana-taleem"/);
  assert.match(publicSeedSource, /slug: "seasonal-relief"/);

  assert.doesNotMatch(publicSeedSource, /slug: "seasonal-food-support"/);
  assert.doesNotMatch(publicSeedSource, /slug: "education"/);
  assert.doesNotMatch(publicSeedSource, /slug: "emergency-relief"/);

  assert.match(publicSeedSource, /slug: "winter-relief"[\s\S]*?primaryMetric: "234 Winter Kits"[\s\S]*?primaryMetricLabel: "distributed to 234 beneficiaries"[\s\S]*?causeSlug: "seasonal-relief"/);
  assert.doesNotMatch(publicSeedSource, /primaryMetric: "234\+"/);
  assert.doesNotMatch(publicSeedSource, /campaign-reported beneficiaries/);

  assert.match(publicSeedSource, /slug: "eid-gift-kits"[\s\S]*?causeSlug: "ramadan-eid"/);
  assert.match(publicSeedSource, /slug: "qurbani-meat-distribution"[\s\S]*?causeSlug: "ramadan-eid"/);
  assert.match(publicSeedSource, /slug: "dates-distribution"[\s\S]*?causeSlug: "ramadan-eid"/);
  assert.match(publicSeedSource, /slug: "taleem"[\s\S]*?causeSlug: "amaana-taleem"/);
  assert.match(publicSeedSource, /slug: "hyderabad-flood-relief-2020"[\s\S]*?causeSlug: "emergency-humanitarian-relief"/);
});
