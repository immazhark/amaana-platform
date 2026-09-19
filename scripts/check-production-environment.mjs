import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_SECRET_LENGTHS = {
  CRON_SECRET: 32,
  ASSISTANCE_TOKEN_PEPPER: 32,
  DONATION_TOKEN_PEPPER: 32,
  AUTH_RATE_LIMIT_PEPPER: 32,
  RAZORPAY_KEY_SECRET: 16,
  RAZORPAY_WEBHOOK_SECRET: 16,
  S3_ACCESS_KEY_ID: 8,
  S3_SECRET_ACCESS_KEY: 16,
};

function nonEmpty(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function requireValue(env, name, problems) {
  const value = nonEmpty(env, name);
  if (!value) problems.push(`${name} is required.`);
  return value;
}

export function validateProductionEnvironmentContract(env) {
  const problems = [];

  if (env.APP_ENVIRONMENT !== "production") {
    problems.push("APP_ENVIRONMENT must be production.");
  }

  if (env.EMAIL_DELIVERY_MODE !== "live") {
    problems.push("EMAIL_DELIVERY_MODE must be live for final production acceptance.");
  }

  const appUrl = requireValue(env, "NEXT_PUBLIC_APP_URL", problems);
  if (appUrl) {
    try {
      if (new URL(appUrl).origin !== "https://amaanafoundation.org") {
        problems.push("NEXT_PUBLIC_APP_URL must use the official https://amaanafoundation.org origin.");
      }
    } catch {
      problems.push("NEXT_PUBLIC_APP_URL must be a valid URL.");
    }
  }

  const keyId = requireValue(env, "NEXT_PUBLIC_RAZORPAY_KEY_ID", problems);
  if (keyId && !keyId.startsWith("rzp_live_")) {
    problems.push("NEXT_PUBLIC_RAZORPAY_KEY_ID must be a Razorpay Live key.");
  }

  const from = requireValue(env, "EMAIL_FROM", problems);
  if (from && !/@amaanafoundation\.org(?:>|$)/i.test(from)) {
    problems.push("EMAIL_FROM must use an amaanafoundation.org sending identity.");
  }

  const resendKey = requireValue(env, "RESEND_API_KEY", problems);
  if (resendKey && !resendKey.startsWith("re_")) {
    problems.push("RESEND_API_KEY must use a Resend API key.");
  }

  const databaseUrl = requireValue(env, "DATABASE_URL", problems);
  if (databaseUrl && !/^(?:postgres|postgresql):\/\//i.test(databaseUrl)) {
    problems.push("DATABASE_URL must use a PostgreSQL connection URL.");
  }

  const privateBucket = requireValue(env, "S3_BUCKET", problems);
  requireValue(env, "S3_REGION", problems);
  requireValue(env, "S3_ENDPOINT", problems);

  const publicBucket = requireValue(env, "PUBLIC_MEDIA_S3_BUCKET", problems);
  const publicBaseUrl = requireValue(env, "PUBLIC_MEDIA_BASE_URL", problems);
  if (privateBucket && publicBucket && privateBucket === publicBucket) {
    problems.push("PUBLIC_MEDIA_S3_BUCKET must differ from the private assistance S3_BUCKET.");
  }
  if (publicBaseUrl) {
    try {
      if (new URL(publicBaseUrl).protocol !== "https:") {
        problems.push("PUBLIC_MEDIA_BASE_URL must use HTTPS.");
      }
    } catch {
      problems.push("PUBLIC_MEDIA_BASE_URL must be a valid URL.");
    }
  }

  for (const [name, minLength] of Object.entries(REQUIRED_SECRET_LENGTHS)) {
    const value = requireValue(env, name, problems);
    if (value && value.length < minLength) {
      problems.push(`${name} must be at least ${minLength} characters.`);
    }
  }

  for (const flag of ["STAGING_ACCEPTANCE_ON_START", "PUBLIC_MEDIA_ACCEPTANCE_ON_START", "AMAANA_BROWSER_ACCEPTANCE"]) {
    if (String(env[flag] ?? "").toLowerCase() === "true") {
      problems.push(`${flag} must not be enabled in production.`);
    }
  }

  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = validateProductionEnvironmentContract(process.env);
  if (problems.length) {
    console.error("Production environment contract failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("Production environment contract passed.");
    console.log("No secret values were printed.");
  }
}
