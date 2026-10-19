import { DONATION_INTENTS } from "./donation-intent";

export type AcknowledgementRecord = {
  found: true;
  presentation: {
    tone: "captured" | "pending" | "failed" | "refunded";
    heading: string;
    summary: string;
    statusLabel: string;
  };
  donation: {
    referenceNumber: string;
    receiptNumber: string | null;
    donorName: string;
    givingIntent: string;
    amount: number;
    refundedAmount: number;
    recordDate: string;
    providerPaymentId: string | null;
    appeal: { title: string; slug: string };
  };
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 4096;
}

function nullableText(value: unknown): value is string | null {
  return value === null || text(value);
}

function money(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return false;
  const paise = Math.round(value * 100);
  return Number.isSafeInteger(paise) && Math.abs(value - paise / 100) <= Number.EPSILON * Math.max(1, value) * 2;
}

function serverTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

/** Fail closed on malformed private financial reads. Never turn a failed read
 * into a new donation or an apparently invalid donor receipt. */
export function isAcknowledgementResponse(value: unknown, expectedReference: string): value is AcknowledgementRecord | { found: false } {
  if (!object(value)) return false;
  if (value.found === false) return true;
  if (value.found !== true || !object(value.presentation) || !object(value.donation)) return false;

  const p = value.presentation;
  const d = value.donation;
  if (
    (typeof p.tone !== "string" || !["captured", "pending", "failed", "refunded"].includes(p.tone)) ||
    !text(p.heading) || !text(p.summary) || !text(p.statusLabel) ||
    !text(d.referenceNumber) || d.referenceNumber !== expectedReference ||
    !nullableText(d.receiptNumber) || !text(d.donorName) ||
    !DONATION_INTENTS.some(intent => intent === d.givingIntent) ||
    !money(d.amount) || d.amount <= 0 ||
    !money(d.refundedAmount) || d.refundedAmount > d.amount ||
    !serverTimestamp(d.recordDate) || !nullableText(d.providerPaymentId) ||
    !object(d.appeal) || !text(d.appeal.title) ||
    typeof d.appeal.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.appeal.slug)
  ) return false;

  if (p.tone === "refunded") return d.refundedAmount === d.amount;
  if (p.tone === "captured") return d.refundedAmount < d.amount;
  return d.refundedAmount === 0;
}
