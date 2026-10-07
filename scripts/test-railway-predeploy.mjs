import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateRailwayDeployEnvironment } from "../prisma/railway-predeploy.mjs";

function base() {
  return {
    APP_ENVIRONMENT: "staging",
    NEXT_PUBLIC_APP_URL: "https://preview.example.com",
    NEXT_PUBLIC_ALLOW_INDEXING: "false",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_example",
    RAZORPAY_KEY_SECRET: "r".repeat(16),
    RAZORPAY_WEBHOOK_SECRET: "w".repeat(16),
    DATABASE_URL: "postgresql://user:password@example.invalid/amaana",
    EMAIL_DELIVERY_MODE: "disabled",
    EMAIL_FROM: "Amaana Foundation <notifications@amaanafoundation.org>",
    RESEND_API_KEY: "re_example",
    CRON_SECRET: "c".repeat(32),
    S3_REGION: "sin",
    S3_BUCKET: "private-documents",
    S3_ENDPOINT: "https://s3.example.com",
    S3_ACCESS_KEY_ID: "access-key",
    S3_SECRET_ACCESS_KEY: "s".repeat(16),
    PUBLIC_MEDIA_S3_BUCKET: "public-media",
    PUBLIC_MEDIA_BASE_URL: "https://preview.example.com/media",
    ASSISTANCE_TOKEN_PEPPER: "a".repeat(32),
    DONATION_TOKEN_PEPPER: "d".repeat(32),
    AUTH_RATE_LIMIT_PEPPER: "u".repeat(32),
  };
}

test("accepts the staging deployment posture", () => {
  assert.deepEqual(validateRailwayDeployEnvironment(base()), []);
});

test("rejects live payment or indexing posture in staging", () => {
  const env = base();
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_wrong";
  env.NEXT_PUBLIC_ALLOW_INDEXING = "true";
  env.EMAIL_DELIVERY_MODE = "live";
  const problems = validateRailwayDeployEnvironment(env).join("\n");
  assert.match(problems, /Razorpay Test key/);
  assert.match(problems, /EMAIL_DELIVERY_MODE/);
  assert.match(problems, /NEXT_PUBLIC_ALLOW_INDEXING/);
});

test("accepts the official production origin and explicit indexing decision", () => {
  const env = base();
  env.APP_ENVIRONMENT = "production";
  env.NEXT_PUBLIC_APP_URL = "https://amaanafoundation.org";
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_example";
  env.PRODUCTION_INDEXING_DECISION = "enable";
  env.NEXT_PUBLIC_ALLOW_INDEXING = "true";
  assert.deepEqual(validateRailwayDeployEnvironment(env), []);
});

test("rejects unsafe production origin, key, storage overlap and indexing mismatch", () => {
  const env = base();
  env.APP_ENVIRONMENT = "production";
  env.NEXT_PUBLIC_APP_URL = "https://example.com";
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_wrong";
  env.PRODUCTION_INDEXING_DECISION = "enable";
  env.NEXT_PUBLIC_ALLOW_INDEXING = "false";
  env.PUBLIC_MEDIA_S3_BUCKET = env.S3_BUCKET;
  const problems = validateRailwayDeployEnvironment(env).join("\n");
  assert.match(problems, /official https:\/\/amaanafoundation\.org/);
  assert.match(problems, /Razorpay Live key/);
  assert.match(problems, /must differ/);
  assert.match(problems, /must be true when PRODUCTION_INDEXING_DECISION=enable/);
});

test("never echoes secret values in validation failures", () => {
  const env = base();
  env.RAZORPAY_KEY_SECRET = "tiny";
  const problems = validateRailwayDeployEnvironment(env);
  assert.ok(problems.some(problem => problem.includes("RAZORPAY_KEY_SECRET")));
  assert.ok(problems.every(problem => !problem.includes("tiny")));
});

test("wrapper runs release preparation before declaring pre-deploy completion", async () => {
  const source = await readFile("prisma/railway-predeploy.mjs", "utf8");
  const releasePrepare = source.indexOf('await import("./release-prepare.mjs")');
  const completion = source.indexOf('Railway pre-deploy release preparation verified.');
  assert.ok(releasePrepare >= 0);
  assert.ok(completion > releasePrepare);
});
