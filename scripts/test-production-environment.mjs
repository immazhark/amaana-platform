import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateProductionEnvironmentContract } from "./check-production-environment.mjs";

function validEnv() {
  return {
    APP_ENVIRONMENT: "production",
    EMAIL_DELIVERY_MODE: "live",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/amaana?sslmode=require",
    NEXT_PUBLIC_APP_URL: "https://amaanafoundation.org",
    PRODUCTION_INDEXING_DECISION: "keep_disabled",
    NEXT_PUBLIC_ALLOW_INDEXING: "false",
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
    NEXT_PUBLIC_DONATION_UPI_QR_URL: "https://amaanafoundation.org/media/donation-upi-qr.png",
    DONATION_BANK_ACCOUNT_NAME: "AMAANA FOUNDATION",
    DONATION_BANK_ACCOUNT_NUMBER: "123456789012345",
    DONATION_BANK_IFSC: "UTIB0000001",
    DONATION_BANK_NAME: "Axis Bank",
    DONATION_BANK_BRANCH: "Hyderabad",
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

test("requires an explicit production indexing decision and matching public flag", () => {
  const missing = validEnv();
  delete missing.PRODUCTION_INDEXING_DECISION;
  assert.match(validateProductionEnvironmentContract(missing).join("\n"), /PRODUCTION_INDEXING_DECISION is required/);

  const missingFlag = validEnv();
  delete missingFlag.NEXT_PUBLIC_ALLOW_INDEXING;
  assert.match(validateProductionEnvironmentContract(missingFlag).join("\n"), /NEXT_PUBLIC_ALLOW_INDEXING is required/);

  const malformedFlag = validEnv();
  malformedFlag.NEXT_PUBLIC_ALLOW_INDEXING = "yes";
  assert.match(validateProductionEnvironmentContract(malformedFlag).join("\n"), /NEXT_PUBLIC_ALLOW_INDEXING must be true or false/);

  const enableMismatch = validEnv();
  enableMismatch.PRODUCTION_INDEXING_DECISION = "enable";
  enableMismatch.NEXT_PUBLIC_ALLOW_INDEXING = "false";
  assert.match(validateProductionEnvironmentContract(enableMismatch).join("\n"), /NEXT_PUBLIC_ALLOW_INDEXING must be true/);

  const disabledMismatch = validEnv();
  disabledMismatch.PRODUCTION_INDEXING_DECISION = "keep_disabled";
  disabledMismatch.NEXT_PUBLIC_ALLOW_INDEXING = "true";
  assert.match(validateProductionEnvironmentContract(disabledMismatch).join("\n"), /must be false/);

  const enabled = validEnv();
  enabled.PRODUCTION_INDEXING_DECISION = "enable";
  enabled.NEXT_PUBLIC_ALLOW_INDEXING = "true";
  assert.deepEqual(validateProductionEnvironmentContract(enabled), []);
});

test("rejects public media delivery outside the official Amaana media boundary", () => {
  const wrongHost = validEnv();
  wrongHost.PUBLIC_MEDIA_BASE_URL = "https://cdn.example.com/media";
  assert.match(validateProductionEnvironmentContract(wrongHost).join("\n"), /official .*\/media/i);

  const wrongPath = validEnv();
  wrongPath.PUBLIC_MEDIA_BASE_URL = "https://amaanafoundation.org/uploads";
  assert.match(validateProductionEnvironmentContract(wrongPath).join("\n"), /official .*\/media/i);

  const withQuery = validEnv();
  withQuery.PUBLIC_MEDIA_BASE_URL = "https://amaanafoundation.org/media?source=preview";
  assert.match(validateProductionEnvironmentContract(withQuery).join("\n"), /without query or fragment/i);
});

test("rejects insecure or malformed private storage endpoints", () => {
  const insecure = validEnv();
  insecure.S3_ENDPOINT = "http://s3.example.com";
  assert.match(validateProductionEnvironmentContract(insecure).join("\n"), /S3_ENDPOINT must use HTTPS/);

  const malformed = validEnv();
  malformed.S3_ENDPOINT = "not-a-url";
  assert.match(validateProductionEnvironmentContract(malformed).join("\n"), /S3_ENDPOINT must be a valid URL/);

  const malformedBoolean = validEnv();
  malformedBoolean.S3_FORCE_PATH_STYLE = "sometimes";
  assert.match(validateProductionEnvironmentContract(malformedBoolean).join("\n"), /S3_FORCE_PATH_STYLE must be true or false/);
});

test("validates optional public-media storage overrides without requiring them", () => {
  const fallback = validEnv();
  assert.deepEqual(validateProductionEnvironmentContract(fallback), []);

  const partialCredentials = validEnv();
  partialCredentials.PUBLIC_MEDIA_S3_ACCESS_KEY_ID = "public-access";
  assert.match(
    validateProductionEnvironmentContract(partialCredentials).join("\n"),
    /PUBLIC_MEDIA_S3_ACCESS_KEY_ID and PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY must be configured together/,
  );

  const insecureEndpoint = validEnv();
  insecureEndpoint.PUBLIC_MEDIA_S3_ENDPOINT = "http://public-s3.example.com";
  assert.match(validateProductionEnvironmentContract(insecureEndpoint).join("\n"), /PUBLIC_MEDIA_S3_ENDPOINT must use HTTPS/);

  const malformedEndpoint = validEnv();
  malformedEndpoint.PUBLIC_MEDIA_S3_ENDPOINT = "not-a-url";
  assert.match(validateProductionEnvironmentContract(malformedEndpoint).join("\n"), /PUBLIC_MEDIA_S3_ENDPOINT must be a valid URL/);

  const malformedPathStyle = validEnv();
  malformedPathStyle.PUBLIC_MEDIA_S3_FORCE_PATH_STYLE = "1";
  assert.match(validateProductionEnvironmentContract(malformedPathStyle).join("\n"), /PUBLIC_MEDIA_S3_FORCE_PATH_STYLE must be true or false/);

  const explicitOverrides = validEnv();
  explicitOverrides.PUBLIC_MEDIA_S3_ACCESS_KEY_ID = "public-access";
  explicitOverrides.PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY = "public-secret";
  explicitOverrides.PUBLIC_MEDIA_S3_ENDPOINT = "https://public-s3.example.com";
  explicitOverrides.PUBLIC_MEDIA_S3_FORCE_PATH_STYLE = "true";
  assert.deepEqual(validateProductionEnvironmentContract(explicitOverrides), []);
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


test(".env.example documents all explicit production posture controls", async () => {
  const example = await readFile(".env.example", "utf8");

  for (const name of [
    "APP_ENVIRONMENT",
    "EMAIL_DELIVERY_MODE",
    "NEXT_PUBLIC_APP_URL",
    "PRODUCTION_INDEXING_DECISION",
    "NEXT_PUBLIC_ALLOW_INDEXING",
    "STAGING_ACCEPTANCE_ON_START",
    "PUBLIC_MEDIA_ACCEPTANCE_ON_START",
    "AMAANA_BROWSER_ACCEPTANCE",
    "PUBLIC_MEDIA_S3_BUCKET",
    "PUBLIC_MEDIA_BASE_URL",
    "NEXT_PUBLIC_DONATION_UPI_QR_URL",
    "DONATION_BANK_ACCOUNT_NAME",
    "DONATION_BANK_ACCOUNT_NUMBER",
    "DONATION_BANK_IFSC",
    "DONATION_BANK_NAME",
    "DONATION_BANK_BRANCH",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ]) {
    assert.match(example, new RegExp(`^${name}=`, "m"), `.env.example must document ${name}`);
  }

  assert.match(example, /^APP_ENVIRONMENT="staging"$/m);
  assert.match(example, /^PRODUCTION_INDEXING_DECISION="keep_disabled"$/m);
  assert.match(example, /^NEXT_PUBLIC_ALLOW_INDEXING="false"$/m);
  assert.match(example, /^STAGING_ACCEPTANCE_ON_START="false"$/m);
  assert.match(example, /^PUBLIC_MEDIA_ACCEPTANCE_ON_START="false"$/m);
  assert.match(example, /^AMAANA_BROWSER_ACCEPTANCE="false"$/m);
});
