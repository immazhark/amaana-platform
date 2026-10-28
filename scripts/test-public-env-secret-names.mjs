import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("prebuild and predev reject public credential names before generating assets", async () => {
  const { scripts } = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(scripts.prebuild, /^npm run security:public-env && /);
  assert.match(scripts.predev, /^npm run security:public-env && /);
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
