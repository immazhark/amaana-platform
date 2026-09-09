import { createHmac, timingSafeEqual } from "node:crypto";

const apiBase = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("Razorpay is not configured");
  return { keyId, secret };
}

async function requestRazorpay(path: string, init?: RequestInit) {
  const { keyId, secret } = credentials();
  const response = await fetch(`${apiBase}${path}`, { ...init, headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  if (!response.ok) throw new Error(`Razorpay request failed with status ${response.status}`);
  return response.json();
}

export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; appealId: string }) {
  return requestRazorpay("/orders", { method: "POST", body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: { appealId: input.appealId } }) }) as Promise<{ id: string; amount: number; currency: string; receipt: string; status: string }>;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return requestRazorpay(`/payments/${encodeURIComponent(paymentId)}`) as Promise<{ id: string; order_id: string; amount: number; currency: string; status: string; captured: boolean; email?: string; contact?: string }>;
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const { secret } = credentials(); const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(signature); const b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET; if (!secret) throw new Error("Razorpay webhook is not configured");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex"); const a = Buffer.from(signature); const b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b);
}
