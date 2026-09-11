import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isEmailDeliveryEnabled, validateProductionEnvironment } from "./env";

const requiredProductionEnv = {
  APP_ENVIRONMENT: "production",
  EMAIL_DELIVERY_MODE: "live",
  DATABASE_URL: "https://example.com/database",
  NEXT_PUBLIC_APP_URL: "https://example.com",
  EMAIL_FROM: "Amaana <noreply@example.com>",
  RESEND_API_KEY: "re_test_key",
  CRON_SECRET: "c".repeat(32),
  S3_REGION: "sin",
  S3_BUCKET: "amaana-assistance-staging",
  S3_ENDPOINT: "https://s3.example.com",
  S3_ACCESS_KEY_ID: "access-key",
  S3_SECRET_ACCESS_KEY: "s".repeat(16),
  ASSISTANCE_TOKEN_PEPPER: "a".repeat(32),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_example",
  RAZORPAY_KEY_SECRET: "r".repeat(16),
  RAZORPAY_WEBHOOK_SECRET: "w".repeat(16),
  DONATION_TOKEN_PEPPER: "d".repeat(32),
  AUTH_RATE_LIMIT_PEPPER: "u".repeat(32),
} as const;

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv, ...requiredProductionEnv, NODE_ENV: "production" };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("production environment safety", () => {
  it("accepts the default production deployment posture", () => {
    expect(() => validateProductionEnvironment()).not.toThrow();
    expect(isEmailDeliveryEnabled()).toBe(true);
  });

  it("accepts staging only with Razorpay test mode and disabled email delivery", () => {
    process.env.APP_ENVIRONMENT = "staging";
    process.env.EMAIL_DELIVERY_MODE = "disabled";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_example";

    expect(() => validateProductionEnvironment()).not.toThrow();
    expect(isEmailDeliveryEnabled()).toBe(false);
  });

  it("rejects a live Razorpay key in staging", () => {
    process.env.APP_ENVIRONMENT = "staging";
    process.env.EMAIL_DELIVERY_MODE = "disabled";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_example";

    expect(() => validateProductionEnvironment()).toThrow(/Razorpay test key/);
  });

  it("rejects enabled email delivery in staging", () => {
    process.env.APP_ENVIRONMENT = "staging";
    process.env.EMAIL_DELIVERY_MODE = "live";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_example";

    expect(() => validateProductionEnvironment()).toThrow(/email delivery must be disabled/);
  });
});
