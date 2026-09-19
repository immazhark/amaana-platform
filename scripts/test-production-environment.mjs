import test from "node:test";
import assert from "node:assert/strict";
import { validateProductionEnvironmentContract } from "./check-production-environment.mjs";

function validEnv() {
  return {
    APP_ENVIRONMENT: "production",
    EMAIL_DELIVERY_MODE: "live",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/amaana?sslmode=require",
    NEXT_PUBLIC_APP_URL: "https://amaanafoundation.org",
    EMAIL_FROM: "Amaana Foundation <notifications@amaanafoundation.org>",
    RESEND_API_KEY: "re_production_key",
    CRON_SECRET: "c".repeat(32),
    S3_REGION: "sin",
    S3_BUCKET: "amaana-assistance-production",
    S3_ENDPOINT: "https://s3.example.com",
    S3_ACCESS_KEY_ID: "access-key",
    S3_SECRET_ACCESS_KEY: "s".repeat(16),
    PUBLIC_MEDIA_S3_BUCKET: "amaana-public-media-production",
    PUBLIC_MEDIA_BASE_URL: "https://amaanafoundation.org/media",
    ASSISTANCE_TOKEN_PEPPER: "a".repeat(32),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_example",
    RAZORPAY_KEY_SECRET: "r".repeat(16),
    RAZORPAY_WEBHOOK_SECRET: "w".repeat(16),
    DONATION_TOKEN_PEPPER: "d".repeat(32),
    AUTH_RATE_LIMIT_PEPPER: "u".repeat(32),
    STAGING_ACCEPTANCE_ON_START: "false",
    PUBLIC_MEDIA_ACCEPTANCE_ON_START: "false",
    AMAANA_BROWSER_ACCEPTANCE: "false",
  };
}

test("accepts a separated final production environment", () => {
  assert.deepEqual(validateProductionEnvironmentContract(validEnv()), []);
});

test("rejects staging payment/email posture and non-official origin", () => {
  const env = validEnv();
  env.APP_ENVIRONMENT = "staging";
  env.EMAIL_DELIVERY_MODE = "disabled";
  env.NEXT_PUBLIC_APP_URL = "https://amaana-rebuild-preview-production.up.railway.app";
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_example";

  const problems = validateProductionEnvironmentContract(env).join("\n");
  assert.match(problems, /APP_ENVIRONMENT/);
  assert.match(problems, /EMAIL_DELIVERY_MODE/);
  assert.match(problems, /official/);
  assert.match(problems, /Live key/);
});

test("rejects shared public/private storage and launch-only acceptance flags", () => {
  const env = validEnv();
  env.PUBLIC_MEDIA_S3_BUCKET = env.S3_BUCKET;
  env.STAGING_ACCEPTANCE_ON_START = "true";
  env.AMAANA_BROWSER_ACCEPTANCE = "true";

  const problems = validateProductionEnvironmentContract(env).join("\n");
  assert.match(problems, /must differ/);
  assert.match(problems, /STAGING_ACCEPTANCE_ON_START/);
  assert.match(problems, /AMAANA_BROWSER_ACCEPTANCE/);
});

test("never needs secret values to describe a failure", () => {
  const env = validEnv();
  env.RAZORPAY_KEY_SECRET = "short";
  const problems = validateProductionEnvironmentContract(env);
  assert.ok(problems.some(problem => problem.includes("RAZORPAY_KEY_SECRET")));
  assert.ok(problems.every(problem => !problem.includes("short")));
});
