import { z } from "zod";

export function isRazorpayKeyValidForEnvironment(environment: "production" | "staging", keyId: string) {
  return environment === "staging" ? keyId.startsWith("rzp_test_") : keyId.startsWith("rzp_live_");
}

const productionSchema = z.object({
  APP_ENVIRONMENT: z.enum(["production", "staging"]).default("production"),
  EMAIL_DELIVERY_MODE: z.enum(["live", "disabled"]).default("disabled"),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }, "Production URL must use HTTPS without embedded credentials"),
  NEXT_PUBLIC_DONATION_UPI_QR_URL: z.string().url().refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }, "Donation QR URL must use HTTPS without embedded credentials").optional(),
  EMAIL_FROM: z.string().min(3),
  RESEND_API_KEY: z.string().startsWith("re_"),
  CRON_SECRET: z.string().min(32),
  S3_REGION: z.string().min(2),
  S3_BUCKET: z.string().min(3),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(8),
  S3_SECRET_ACCESS_KEY: z.string().min(16),
  PUBLIC_MEDIA_S3_BUCKET: z.string().min(3),
  PUBLIC_MEDIA_BASE_URL: z.string().url().refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }, "Public media URL must use HTTPS without embedded credentials"),
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

/**
 * The instant live email delivery starts. Messages created before it are never sent: months of queued acknowledgements
 * must not reach donors as stale mail on the day delivery is switched on. Strict ISO 8601 with an explicit offset, for
 * example 2026-11-22T06:00:00Z. Missing or malformed means no go-live has been declared.
 */
export function emailSendNotBefore(env: Record<string, string | undefined> = process.env): Date | null {
  const raw = env.NOTIFICATION_SEND_NOT_BEFORE?.trim();
  if (!raw || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(raw)) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The sender must be on the verified Amaana domain. The provider's own test sender only delivers to the account owner, so
 * every other donor's message is refused at send time (a 403 that parks the message for good). Checked before going live. */
export function hasOfficialEmailSender(env: Record<string, string | undefined> = process.env) {
  const from = env.EMAIL_FROM?.trim();
  return Boolean(from) && /@amaanafoundation\.org>?$/i.test(from as string);
}

export function isEmailDeliveryEnabled(env: Record<string, string | undefined> = process.env) {
  // The notification cron does not invoke the full deployment schema.
  // Refuse live delivery from staging even when its mode is misconfigured.
  // Live also needs a declared go-live instant, so a switch flipped alone can never drain the old queue.
  const environment = env.APP_ENVIRONMENT ?? "production";
  return environment === "production" && env.EMAIL_DELIVERY_MODE === "live" && emailSendNotBefore(env) !== null && hasOfficialEmailSender(env);
}
