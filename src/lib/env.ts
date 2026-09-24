import { z } from "zod";

export function isRazorpayKeyValidForEnvironment(environment: "production" | "staging", keyId: string) {
  return environment === "staging" ? keyId.startsWith("rzp_test_") : keyId.startsWith("rzp_live_");
}

const productionSchema = z.object({
  APP_ENVIRONMENT: z.enum(["production", "staging"]).default("production"),
  EMAIL_DELIVERY_MODE: z.enum(["live", "disabled"]).default("disabled"),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().refine(value => value.startsWith("https://"), "Production URL must use HTTPS"),
  EMAIL_FROM: z.string().min(3),
  RESEND_API_KEY: z.string().startsWith("re_"),
  CRON_SECRET: z.string().min(32),
  S3_REGION: z.string().min(2),
  S3_BUCKET: z.string().min(3),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(8),
  S3_SECRET_ACCESS_KEY: z.string().min(16),
  PUBLIC_MEDIA_S3_BUCKET: z.string().min(3),
  PUBLIC_MEDIA_BASE_URL: z.string().url().refine(value => value.startsWith("https://"), "Public media URL must use HTTPS"),
  ASSISTANCE_TOKEN_PEPPER: z.string().min(32),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().startsWith("rzp_"),
  RAZORPAY_KEY_SECRET: z.string().min(16),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(16),
  DONATION_TOKEN_PEPPER: z.string().min(32),
  AUTH_RATE_LIMIT_PEPPER: z.string().min(32),
}).superRefine((env, ctx) => {
  if (!isRazorpayKeyValidForEnvironment(env.APP_ENVIRONMENT, env.NEXT_PUBLIC_RAZORPAY_KEY_ID)) {
    ctx.addIssue({
      code: "custom",
      path: ["NEXT_PUBLIC_RAZORPAY_KEY_ID"],
      message: env.APP_ENVIRONMENT === "staging"
        ? "Staging must use a Razorpay test key"
        : "Production must use a Razorpay live key",
    });
  }

  if (env.PUBLIC_MEDIA_S3_BUCKET === env.S3_BUCKET) {
    ctx.addIssue({
      code: "custom",
      path: ["PUBLIC_MEDIA_S3_BUCKET"],
      message: "Public media storage must use a separate bucket from private assistance documents",
    });
  }

  if (env.APP_ENVIRONMENT === "production") {
    let origin = "";
    try {
      origin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
    } catch {
      // The base schema already reports malformed URLs.
    }
    if (origin !== "https://amaanafoundation.org") {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "Production canonical origin must be https://amaanafoundation.org",
      });
    }
  }

  if (env.APP_ENVIRONMENT === "staging" && env.EMAIL_DELIVERY_MODE !== "disabled") {
    ctx.addIssue({
      code: "custom",
      path: ["EMAIL_DELIVERY_MODE"],
      message: "Staging email delivery must be disabled",
    });
  }
});

export function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== "production") return;
  productionSchema.parse(process.env);
}

export function isEmailDeliveryEnabled() {
  return process.env.EMAIL_DELIVERY_MODE === "live";
}
