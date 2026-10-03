import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const masterPath = path.join(root, "src/content/master-copy.json");
const programmesPath = path.join(root, "prisma/master-programmes.json");
const factualLocksPath = path.join(root, "prisma/canonical-factual-locks.json");
const checkOnly = process.argv.includes("--check");

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function replaceLockedText(value, replacements = []) {
  if (!value) return value;
  return replacements.reduce(
    (current, replacement) => current.replaceAll(replacement.from, replacement.to),
    value,
  );
}

function applyCanonicalFactualLocks(records, locks) {
  const lockBySlug = new Map();
  for (const lock of locks.initiatives) {
    lockBySlug.set(lock.slug, lock);
    for (const legacySlug of lock.legacySlugs || []) lockBySlug.set(legacySlug, lock);
  }

  for (const record of records) {
    const lock = lockBySlug.get(record.slug);
    if (!lock) continue;
    if (Object.prototype.hasOwnProperty.call(lock, "primaryMetric")) record.primaryMetric = lock.primaryMetric;
    if (Object.prototype.hasOwnProperty.call(lock, "primaryMetricLabel")) record.primaryMetricLabel = lock.primaryMetricLabel;
    record.summary = lock.summary ?? replaceLockedText(record.summary, lock.textReplacements);
    record.story = lock.story ?? replaceLockedText(record.story, lock.textReplacements);
    if (Object.prototype.hasOwnProperty.call(lock, "facts")) record.facts = lock.facts;
    if (Object.prototype.hasOwnProperty.call(lock, "dataCaveat")) record.dataCaveat = lock.dataCaveat;
  }
}

// The original one-off prose import source was never committed to the repository.
// The tracked structured runtime master copy is therefore the reproducible source.
// This tool normalizes canonical factual locks and synchronizes the Prisma seed subset.
const master = readJson(masterPath);
const factualLocks = readJson(factualLocksPath);
const categories = structuredClone(master.categories);
const items = structuredClone(master.initiatives);
applyCanonicalFactualLocks(items, factualLocks);

const normalizedMaster = {
  ...master,
  categories,
  initiatives: items,
};
const normalizedProgrammes = {
  version: normalizedMaster.version,
  categories,
  initiatives: items,
};

const expectedMaster = stableJson(normalizedMaster);
const expectedProgrammes = stableJson(normalizedProgrammes);

if (checkOnly) {
  const mismatches = [];
  if (fs.readFileSync(masterPath, "utf8").replace(/\r\n/g, "\n") !== expectedMaster) {
    mismatches.push("src/content/master-copy.json");
  }
  if (fs.readFileSync(programmesPath, "utf8").replace(/\r\n/g, "\n") !== expectedProgrammes) {
    mismatches.push("prisma/master-programmes.json");
  }

  if (mismatches.length) {
    throw new Error(
      `Master content is out of sync: ${mismatches.join(", ")}. Run npm run master:sync and commit the normalized output.`,
    );
  }

  console.log(
    `Master content check passed: ${items.length} programmes, ${categories.length} categories and canonical factual locks are synchronized.`,
  );
} else {
  fs.writeFileSync(masterPath, expectedMaster);
  fs.writeFileSync(programmesPath, expectedProgrammes);
  console.log(
    `Synchronized ${items.length} programmes and ${categories.length} categories from tracked master copy with canonical factual locks.`,
  );
}
