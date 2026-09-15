import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const locks = JSON.parse(
  await readFile(new URL('../prisma/canonical-factual-locks.json', import.meta.url), 'utf8'),
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

const bySlug = new Map(locks.initiatives.map((item) => [item.slug, item]));

test('newborn medical-aid factual lock uses the confirmed amount', () => {
  const newborn = bySlug.get('emergency-neonatal-medical-aid');
  assert.ok(newborn);
  assert.equal(newborn.primaryMetric, '₹107,520');
  assert.deepEqual(newborn.textReplacements, [{ from: '₹107,200', to: '₹107,520' }]);
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
  assert.match(convenienceContentSource, /234 Winter Kits distributed to 234 beneficiaries/);
  assert.doesNotMatch(convenienceContentSource, /234\+.*campaign-reported beneficiaries/);
});
