import path from "node:path";
import { fileURLToPath } from "node:url";

const MIN_LENGTHS = {
  RAZORPAY_KEY_SECRET: 16,
  RAZORPAY_WEBHOOK_SECRET: 16,
  CRON_SECRET: 32,
  S3_ACCESS_KEY_ID: 8,
  S3_SECRET_ACCESS_KEY: 16,
  ASSISTANCE_TOKEN_PEPPER: 32,
  DONATION_TOKEN_PEPPER: 32,
  AUTH_RATE_LIMIT_PEPPER: 32,
};

function read(env, name, problems, minLength = 1) {
  const value = typeof env[name] === "string" ? env[name].trim() : "";
  if (value.length < minLength) problems.push(`${name} is missing or too short.`);
  return value;
}

function validateHttps(value, name, problems, officialOrigin = null) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") problems.push(`${name} must use HTTPS.`);
    if (officialOrigin && url.origin !== officialOrigin) {
      problems.push(`${name} must use the official ${officialOrigin} origin.`);
    }
  } catch {
    problems.push(`${name} must be a valid URL.`);
  }
}

export function validateRailwayDeployEnvironment(env) {
  const problems = [];
  const environment = read(env, "APP_ENVIRONMENT", problems);
  if (!["production", "staging"].includes(environment)) {
    problems.push("APP_ENVIRONMENT must be production or staging.");
  }

  const appUrl = read(env, "NEXT_PUBLIC_APP_URL", problems);
  validateHttps(
    appUrl,
    "NEXT_PUBLIC_APP_URL",
    problems,
    environment === "production" ? "https://amaanafoundation.org" : null,
  );

  const razorpayKey = read(env, "NEXT_PUBLIC_RAZORPAY_KEY_ID", problems);
  if (environment === "production" && !razorpayKey.startsWith("rzp_live_")) {
    problems.push("NEXT_PUBLIC_RAZORPAY_KEY_ID must be a Razorpay Live key.");
  }
  if (environment === "staging" && !razorpayKey.startsWith("rzp_test_")) {
    problems.push("NEXT_PUBLIC_RAZORPAY_KEY_ID must be a Razorpay Test key.");
  }

  for (const [name, minLength] of Object.entries(MIN_LENGTHS)) {
    read(env, name, problems, minLength);
  }

  read(env, "DATABASE_URL", problems);
  read(env, "EMAIL_FROM", problems, 3);
  const resendKey = read(env, "RESEND_API_KEY", problems);
  if (resendKey && !resendKey.startsWith("re_")) {
    problems.push("RESEND_API_KEY prefix is invalid.");
  }

  read(env, "S3_REGION", problems, 2);
  const privateBucket = read(env, "S3_BUCKET", problems, 3);
  const privateEndpoint = read(env, "S3_ENDPOINT", problems);
  validateHttps(privateEndpoint, "S3_ENDPOINT", problems);

  const publicBucket = read(env, "PUBLIC_MEDIA_S3_BUCKET", problems, 3);
  const publicBaseUrl = read(env, "PUBLIC_MEDIA_BASE_URL", problems);
  validateHttps(publicBaseUrl, "PUBLIC_MEDIA_BASE_URL", problems);
  if (privateBucket && publicBucket && privateBucket === publicBucket) {
    problems.push("PUBLIC_MEDIA_S3_BUCKET must differ from S3_BUCKET.");
  }

  if (environment === "staging") {
    if (env.EMAIL_DELIVERY_MODE !== "disabled") {
      problems.push("EMAIL_DELIVERY_MODE must be disabled in staging.");
    }
    if (String(env.NEXT_PUBLIC_ALLOW_INDEXING).toLowerCase() !== "false") {
      problems.push("NEXT_PUBLIC_ALLOW_INDEXING must be false in staging.");
    }
  }

  if (environment === "production") {
    const indexingDecision = read(env, "PRODUCTION_INDEXING_DECISION", problems);
    const indexingFlag = String(env.NEXT_PUBLIC_ALLOW_INDEXING ?? "").toLowerCase();
    if (!["enable", "keep_disabled"].includes(indexingDecision)) {
      problems.push("PRODUCTION_INDEXING_DECISION must be enable or keep_disabled.");
    }
    if (!["true", "false"].includes(indexingFlag)) {
      problems.push("NEXT_PUBLIC_ALLOW_INDEXING must be true or false in production.");
    } else if (indexingDecision === "enable" && indexingFlag !== "true") {
      problems.push("NEXT_PUBLIC_ALLOW_INDEXING must be true when PRODUCTION_INDEXING_DECISION=enable.");
    } else if (indexingDecision === "keep_disabled" && indexingFlag !== "false") {
      problems.push("NEXT_PUBLIC_ALLOW_INDEXING must be false when PRODUCTION_INDEXING_DECISION=keep_disabled.");
    }
  }

  return problems;
}

async function run() {
  const problems = validateRailwayDeployEnvironment(process.env);
  if (problems.length) {
    for (const problem of problems) console.error("[env]", problem);
    process.exitCode = 1;
    return;
  }

  const label = process.env.APP_ENVIRONMENT === "production" ? "Production" : "Staging";
  console.log(`${label} environment shape passed; no secret values printed.`);
  await import("./release-prepare.mjs");
  console.log("Railway pre-deploy release preparation verified.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}
