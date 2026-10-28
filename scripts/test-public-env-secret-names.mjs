import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const preflightScript = fileURLToPath(new URL("./check-public-env-secret-names.mjs", import.meta.url));

test("prebuild and predev reject public credential names before generating assets", async () => {
  const { scripts } = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(scripts.prebuild, /^npm run security:public-env && /);
  assert.match(scripts.predev, /^npm run security:public-env -- --development && /);
});

test("the public credential preflight fails closed without echoing a secret", () => {
  const value = "synthetic-secret-for-source-test";
  const name = "NEXT_PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY";
  const result = spawnSync(process.execPath, ["scripts/check-public-env-secret-names.mjs"], {
    encoding: "utf8",
    env: { PATH: process.env.PATH, [name]: value },
  });

  assert.equal(result.status, 1);
  assert.equal(result.error, undefined);
  assert.match(result.stderr, new RegExp(name));
  assert.doesNotMatch(result.stdout + result.stderr, /synthetic-secret-for-source-test/);
});

test("the public credential preflight permits approved public settings", () => {
  const result = spawnSync(process.execPath, ["scripts/check-public-env-secret-names.mjs"], {
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      NEXT_PUBLIC_APP_URL: "https://amaanafoundation.org",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_synthetic",
      NEXT_PUBLIC_DONATION_UPI_QR_URL: "https://amaanafoundation.org/media/qr.png",
    },
  });

  assert.equal(result.status, 0);
  assert.equal(result.error, undefined);
});

test("production preflight checks dotenv credential names before Next loads them", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "amaana-public-env-test-"));
  try {
    await writeFile(path.join(workspace, ".env.production.local"), "NEXT_PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY=synthetic-file-secret\n");
    const result = spawnSync(process.execPath, [preflightScript], {
      cwd: workspace,
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /NEXT_PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY/);
    assert.doesNotMatch(result.stderr, /synthetic-file-secret/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("development preflight checks dotenv credential names and preserves public URLs", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "amaana-public-env-test-"));
  try {
    await writeFile(path.join(workspace, ".env.development.local"), "NEXT_PUBLIC_APP_URL=https://amaanafoundation.org\nexport NEXT_PUBLIC_R2_API_TOKEN=synthetic-file-token\n");
    const result = spawnSync(process.execPath, [preflightScript, "--development"], {
      cwd: workspace,
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /NEXT_PUBLIC_R2_API_TOKEN/);
    assert.doesNotMatch(result.stderr, /synthetic-file-token/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
