import { DONATION_INTENTS } from "./donation-intent";

export type AcknowledgementRecord = {
  found: true;
  presentation: { tone: "captured" | "pending" | "failed" | "refunded"; heading: string; summary: string; statusLabel: string };
  donation: {
    referenceNumber: string; receiptNumber: string | null; donorName: string;
    givingIntent: string; amount: number; refundedAmount: number; recordDate: string;
    providerPaymentId: string | null; appeal: { title: string; slug: string };
  };
};

export type TrackingRecord = { found: true; status: string; createdAt: string; updatedAt: string };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 4096;
}

function nullableText(value: unknown) {
  return value === null || text(value);
}

function date(value: unknown) {
  return text(value) && Number.isFinite(Date.parse(value));
}

function amount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// Casts at fetch boundaries cannot establish that JSON is safe to render.
// Invalid responses remain retryable read failures, never new payment/intake attempts.
export function isAcknowledgementResponse(value: unknown, reference: string): value is AcknowledgementRecord | { found: false } {
  if (!object(value)) return false;
  if (value.found === false) return true;
  if (value.found !== true || !object(value.presentation) || !object(value.donation)) return false;
  const { presentation: p, donation: d } = value;
  return typeof p.tone === "string" && ["captured", "pending", "failed", "refunded"].includes(p.tone)
    && text(p.heading) && text(p.summary) && text(p.statusLabel)
    && text(d.referenceNumber) && d.referenceNumber === reference
    && nullableText(d.receiptNumber) && text(d.donorName)
    && DONATION_INTENTS.some(intent => intent === d.givingIntent)
    && amount(d.amount) && d.amount > 0 && amount(d.refundedAmount) && d.refundedAmount <= d.amount
    && date(d.recordDate) && nullableText(d.providerPaymentId)
    && object(d.appeal) && text(d.appeal.title) && text(d.appeal.slug)
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.appeal.slug);
}

export function isTrackingResponse(value: unknown): value is TrackingRecord | { found: false } {
  return object(value) && (value.found === false
    || (value.found === true && text(value.status) && date(value.createdAt) && date(value.updatedAt)));
}
