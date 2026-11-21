import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
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

function hasFirstStatementServerOnlyBoundary(source) {
  // Requiring an actual first import rejects a comment, a late import, and
  // accidental removal before S3 credentials are reachable from client code.
  return /^\uFEFF?\s*import\s+(['"])server-only\1\s*;/.test(source);
}

test("AF-R004 keeps private S3 storage explicitly server-only, with mutation sensitivity", async () => {
  const storagePath = "src/lib/storage.ts";
  const metadata = await lstat(storagePath);
  assert.equal(metadata.isSymbolicLink(), false, "Storage source must not be a symlink");
  assert.equal(metadata.isFile(), true, "Storage source must be a regular file");
  const source = await readFile(storagePath, "utf8");

  assert.equal(hasFirstStatementServerOnlyBoundary(source), true,
    "S3 storage module must import server-only before all SDK imports");

  const removed = source.replace(/^\uFEFF?\s*import\s+(['"])server-only\1\s*;[ \t]*(?:\r?\n|$)/, "");
  assert.notEqual(removed, source, "The mutation must remove the real boundary");
  assert.equal(hasFirstStatementServerOnlyBoundary(removed), false);
  assert.equal(hasFirstStatementServerOnlyBoundary("// import \"server-only\";\nimport { S3Client } from 'sdk';"), false);
  assert.equal(hasFirstStatementServerOnlyBoundary("import { S3Client } from 'sdk';\nimport \"server-only\";"), false);
});
