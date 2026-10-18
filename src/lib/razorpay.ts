import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const apiBase = "https://api.razorpay.com/v1";
const RAZORPAY_REQUEST_TIMEOUT_MS = 15_000;
const paymentResponseSchema = z.object({
  id: z.string().min(1),
  order_id: z.string().min(1).nullable(),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  status: z.string().min(1),
  captured: z.boolean(),
  email: z.string().nullish(),
  contact: z.string().nullish(),
});

function credentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !secret) {
    throw new Error("Razorpay is not configured");
  }

  return { keyId, secret };
}

async function requestRazorpay(path: string, init?: RequestInit) {
  const { keyId, secret } = credentials();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    // Never follow a redirect while making an authenticated payment request.
    // Reject both cross-origin and same-origin redirects rather than trusting
    // any redirected response as authoritative financial provider evidence.
    redirect: "error",
    signal: init?.signal ?? AbortSignal.timeout(RAZORPAY_REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Razorpay request failed with status ${response.status}`);
  }

  return response.json();
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  appealId: string;
  givingIntent: string;
}) {
  return requestRazorpay("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: {
        appealId: input.appealId,
        givingIntent: input.givingIntent,
      },
    }),
  }) as Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  }>;
}

export async function fetchRazorpayPayment(paymentId: string) {
  const payload: unknown = await requestRazorpay(`/payments/${encodeURIComponent(paymentId)}`);
  const parsed = paymentResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid Razorpay payment response");
  return parsed.data;
}

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const { secret } = credentials();
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Razorpay webhook is not configured");
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
