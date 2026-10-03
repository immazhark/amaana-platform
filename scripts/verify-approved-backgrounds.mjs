import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const expected = new Map([
  ["Amaana_Website_Body_Background.svg", "cc3772feaf6935a9df65244dbb1da8842a9eb64f95e5b2cd2df7d47c7a82722d"],
  ["Amaana_Website_Body_Background_Mobile.svg", "3e742c3b1070e251eb86c1dfe52611490f72c595108d9f696a7b6ec9a36ab8c5"],
  ["Amaana_Website_Footer_Background.svg", "93d6f8bf1d6e4dad77718b9b35e1f9b1c9ba74d648f3a62f88a62c4635baad0e"],
  ["Amaana_Website_Footer_Background_Mobile.svg", "cfd3a290c70afcb68f67954f946890d19e6bd5163c2da1b6869f966da40c275e"],
  ["Amaana_Website_Header_Banner.svg", "5bc2669c19271b7497844ac083559916b57ad3a6af097223c4864631ea28f75b"],
  ["Amaana_Website_Header_Banner_Mobile.svg", "5d9c865facaa9657427e23d3b0decceab653936ac546c1d5739a5b86543ac89f"],
]);

const root = path.resolve("public/backgrounds");
let failed = false;

for (const [filename, expectedSha] of expected) {
  const filePath = path.join(root, filename);
  try {
    const bytes = await readFile(filePath);
    const actualSha = createHash("sha256").update(bytes).digest("hex");
    if (actualSha !== expectedSha) {
      failed = true;
      console.error(`✗ ${filename}: SHA-256 mismatch\n  expected ${expectedSha}\n  actual   ${actualSha}`);
    } else {
      console.log(`✓ ${filename}`);
    }
  } catch (error) {
    failed = true;
    console.error(`✗ ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  console.error("\nApproved Amaana background verification failed. Do not deploy with substituted, regenerated or modified background artwork.");
  process.exit(1);
}

console.log("\nAll six approved Amaana background assets match the locked source-of-truth hashes.");
