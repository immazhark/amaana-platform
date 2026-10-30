import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".next/static");
const forbiddenMarkers = [
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "MEDIA_S3_SECRET_ACCESS_KEY",
  "PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "ASSISTANCE_TOKEN_PEPPER",
  "DONATION_TOKEN_PEPPER",
  "AUTH_RATE_LIMIT_PEPPER",
];

async function filesUnder(directory) {
  // A symlinked public artifact can evade this scanner while remaining served.
  if ((await lstat(directory)).isSymbolicLink()) {
    throw new Error("Symbolic link in public client bundle");
  }
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Symbolic link in public client bundle");
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

let files;
try {
  files = await filesUnder(root);
  // Next serves public/ directly; these files never enter .next/static.
  const publicRoot = path.resolve("public");
  let hasPublicRoot = true;
  try {
    await lstat(publicRoot);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    hasPublicRoot = false;
  }
  if (hasPublicRoot) files.push(...await filesUnder(publicRoot));
} catch (error) {
  console.error("Client bundle security check requires a completed Next.js build and readable public assets.", error);
  process.exit(1);
}

// Secret names are useful heuristics, but an inlined value can leak without
// the original environment variable identifier appearing in the client bundle.
// Never print a matched value, even when the check fails.
const secretValues = [...new Set([
  ...forbiddenMarkers.map((name) => process.env[name]),
  process.env.AMAANA_CLIENT_SECRET_CANARY,
].filter((value) => typeof value === "string" && value.length >= 16))];

const offenders = [];
for (const file of files) {
  // Next static JSON, HTML and vector/text assets can be directly fetched too.
  if (!/\.(?:js|mjs|css|map|json|html|htm|svg|txt|md|markdown|csv|tsv|yaml|yml|ini|toml|xml|webmanifest)$/i.test(file)) continue;
  const content = await readFile(file, "utf8");
  for (const marker of forbiddenMarkers) {
    if (content.includes(marker)) offenders.push({ file: path.relative(process.cwd(), file), marker });
  }
  if (secretValues.some((value) => content.includes(value))) {
    offenders.push({ file: path.relative(process.cwd(), file), marker: "[REDACTED SECRET VALUE]" });
  }
}

if (offenders.length) {
  console.error("Forbidden server-secret markers were found in the client bundle:");
  for (const offender of offenders) console.error(`- ${offender.file}: ${offender.marker}`);
  process.exit(1);
}

console.log(`Client bundle secret-boundary check passed across ${files.length} build/public files.`);
