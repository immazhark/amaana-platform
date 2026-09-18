import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const expected = new Map([
  ["Amaana_Website_Body_Background.svg", "7230fcfd9714410e2c5617a070c6e4859484d73ec3bd8bce9c2a08c9770ef123"],
  ["Amaana_Website_Body_Background_Mobile.svg", "753ca2cab543b09680696129884b90486805483572e38b21823705f69a323f86"],
  ["Amaana_Website_Footer_Background.svg", "81713776bbdc977cbee7988a803e474d0bff8e7aa7f2bf2b429e05d4e91e326c"],
  ["Amaana_Website_Footer_Background_Mobile.svg", "84f288e265b0816962ae34ba162df433d3c41848fcb9eaa803f3fd8b6b10ccf7"],
  ["Amaana_Website_Header_Banner.svg", "5ec47ba00b3bf01c5ca4688ba1d728be0000ad97473bfbaa880c5b2fdc1e911f"],
  ["Amaana_Website_Header_Banner_Mobile.svg", "a7da5601196c24786cf9247899e29699f91ca4ad736bc7e0551b6083f54bf15f"],
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
