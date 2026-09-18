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
