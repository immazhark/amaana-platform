import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const scanner = fileURLToPath(new URL("./check-client-secret-boundary.mjs", import.meta.url));
const canary = "amaana-regression-canary-not-a-real-secret-20261010";

function runScanner(contents, environment = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "amaana-secret-boundary-"));
  try {
    const staticDir = path.join(root, ".next", "static");
    mkdirSync(staticDir, { recursive: true });
    writeFileSync(path.join(staticDir, "client.js"), contents);
    return spawnSync(process.execPath, [scanner], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...environment, AMAANA_CLIENT_SECRET_CANARY: canary },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("client bundle guard accepts clean static files", () => {
  const result = runScanner("console.log('safe client bundle')");
  assert.equal(result.status, 0, result.stderr);
});

test("client bundle guard catches forbidden environment variable names", () => {
  const result = runScanner("const suspect = 'RAZORPAY_WEBHOOK_SECRET';");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /RAZORPAY_WEBHOOK_SECRET/);
});

test("client bundle guard catches embedded values but never prints them", () => {
  const result = runScanner(`const embedded = "${canary}";`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /REDACTED SECRET VALUE/);
  assert.doesNotMatch(result.stderr, new RegExp(canary));
  assert.doesNotMatch(result.stdout, new RegExp(canary));
});

test("client bundle guard catches inlined configured server secrets", () => {
  const value = "safe-fake-long-server-secret-value-for-unit-tests";
  const result = runScanner(`const leaked = "${value}";`, {
    RAZORPAY_WEBHOOK_SECRET: value,
  });
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, new RegExp(value));
});
