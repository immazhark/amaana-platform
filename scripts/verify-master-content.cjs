/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

// Use the repository's existing TypeScript/alias loader instead of evaluating
// manually transpiled source strings. Preserve the standalone audit entry point.
const root = path.resolve(__dirname, "..");
execFileSync(process.execPath, [
  path.join(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "src/lib/master-content.test.ts",
], { cwd: root, stdio: "inherit" });
