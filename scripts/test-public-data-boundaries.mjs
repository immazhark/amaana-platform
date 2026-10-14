import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const publicPublishingRoots = [
  "src/app/appeals",
  "src/app/our-work",
  "src/app/stories",
  "src/app/impact",
  "src/components",
  "src/lib/public-content.ts",
  "src/lib/public-page-data.ts",
];

const forbiddenInternalFields = [
  "beneficiaryName",
  "verificationSummary",
  "paymentDestination",
  "internalNotes",
  "trackingTokenHash",
  "receiptTokenHash",
  "objectKey",
];

const allowedFiles = new Set([
  // Admin/private-purpose components do not belong in the public publishing roots above.
]);

async function collectSourceFiles(target, output = []) {
  const stat = await import("node:fs/promises").then(fs => fs.stat(target));
  if (stat.isFile()) {
    if (/\.(?:ts|tsx|js|jsx)$/.test(target)) output.push(target);
    return output;
  }

  for (const entry of await readdir(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) await collectSourceFiles(full, output);
    else if (entry.isFile() && /\.(?:ts|tsx|js|jsx)$/.test(entry.name)) output.push(full);
  }
  return output;
}

test("public publishing surfaces never read private assistance/storage fields", async () => {
  const files = [];
  for (const target of publicPublishingRoots) {
    try {
      await collectSourceFiles(target, files);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const findings = [];
  for (const filename of [...new Set(files)].sort()) {
    if (allowedFiles.has(filename)) continue;
    const source = await readFile(filename, "utf8");
    for (const field of forbiddenInternalFields) {
      const pattern = new RegExp(`\\b${field}\\b`, "g");
      if (pattern.test(source)) findings.push(`${filename}: ${field}`);
    }
  }

  assert.deepEqual(
    findings,
    [],
    `Private/internal fields referenced by public publishing surfaces:\n${findings.join("\n")}`,
  );
});

test("public appeal detail uses consent-controlled display name", async () => {
  const source = await readFile("src/app/appeals/[slug]/page.tsx", "utf8");
  assert.match(source, /beneficiaryDisplayName/);
  assert.doesNotMatch(source, /\bbeneficiaryName\b/);
});

test("cached homepage appeals are rechecked against the current fundraising window", async () => {
  const source = await readFile("src/lib/public-content.ts", "utf8");
  const wrapper = source.match(/export async function getHomepageAppeals\(limit = 3\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(wrapper, "Expected public homepage appeal wrapper");
  assert.match(wrapper, /await getHomepageAppealsCached\(limit\)/);
  assert.match(wrapper, /cached\.filter\(appeal => isAppealOpenForDonations\(appeal\)\)/);
});

test("highly sensitive appeal shares and breadcrumb JSON-LD use privacy-safe copy", async () => {
  const detail = await readFile("src/app/appeals/[slug]/page.tsx", "utf8");
  const structured = await readFile("src/components/appeal-structured-data.tsx", "utf8");
  const copy = await readFile("src/lib/appeal-public-copy.ts", "utf8");

  assert.match(detail, /const safeShareCopy = getAppealPublicCopy\(appeal\.title, appeal\.summary, highlySensitive\)/);
  assert.match(detail, /name: safeShareCopy\.title, path:/);
  assert.match(detail, /<AppealShare title=\{safeShareCopy\.title\} summary=\{safeShareCopy\.description\}/);
  assert.match(detail, /getAppealPublicCopy\(appeal\.title, appeal\.summary, highlySensitive\)/);
  assert.match(structured, /getAppealPublicCopy\(title, summary, highlySensitive\)/);
  assert.match(copy, /return highlySensitive/);
  assert.doesNotMatch(detail, /<AppealShare title=\{appeal\.title\} summary=\{appeal\.summary\}/);
  assert.doesNotMatch(detail, /name: appeal\.title, path:/);
});

test("sensitive appeals cannot be promoted through homepage, directory or initiative projections", async () => {
  const home = await readFile("src/lib/public-content.ts", "utf8");
  const index = await readFile("src/lib/public-page-data.ts", "utf8");
  const restriction = await readFile("src/lib/appeal-promotion.ts", "utf8");

  assert.match(restriction, /confidentialityLevel !== "HIGHLY_SENSITIVE"/);
  assert.match(home, /canPromoteAppeal\(appeal\)/);
  assert.match(home, /appeals:\s*initiative\.appeals\s*\.filter\(canPromoteAppeal\)/);
  assert.match(index, /return appeals\s*\.filter\(canPromoteAppeal\)/);

  // Do not serialize verification status or internal assistance linkage.
  for (const source of [home, index]) {
    assert.match(source, /map\(\(\{ assistanceRequest: _privateReview, \.\.\.publicAppeal \}\) => publicAppeal\)/);
    assert.match(source, /verification: \{ select: \{ confidentialityLevel: true \} \}/);
  }
});
