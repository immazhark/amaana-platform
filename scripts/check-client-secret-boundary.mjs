import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".next/static");
const forbiddenMarkers = [
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "MEDIA_S3_ACCESS_KEY_ID",
  "PUBLIC_MEDIA_S3_ACCESS_KEY_ID",
  "PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY",
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

// A NEXT_PUBLIC_ credential is compiled into browser artifacts when referenced.
// Fail closed on the environment itself; finding a marker only after compilation
// is too late, and the marker name can be erased by minification.
// NEXT_PUBLIC_RAZORPAY_KEY_ID is intentionally publishable and not included.
const publicCredentialNames = Object.keys(process.env).filter((name) =>
  /^NEXT_PUBLIC_(?:(?:PUBLIC_)?MEDIA_S3|S3|AWS)_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)$/.test(name)
  && Boolean(process.env[name]?.trim()),
);
if (publicCredentialNames.length > 0) {
  console.error("Unsafe public-prefixed storage credential configuration:", publicCredentialNames.join(", "));
  process.exit(1);
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

let files;
try {
  files = await filesUnder(root);
} catch (error) {
  console.error("Client bundle security check requires a completed Next.js build.", error);
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
  if (!/\.(?:js|mjs|css|map)$/i.test(file)) continue;
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

console.log(`Client bundle secret-boundary check passed across ${files.length} static build files.`);
