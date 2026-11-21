import { DONATION_INTENTS } from "./donation-intent";
/** Private financial records must preserve the ledger's paise precision. */
export function formatAcknowledgementINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


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
    // Exactly one destination: an appeal, or a designated fund.
    appeal: { title: string; slug: string } | null;
    fund?: { name: string; slug: string } | null;
    // Optional gateway fee the donor covered on top of the gift. Absent means none.
    feeContributionAmount?: number;
    // Seasonal fixed-price initiative the gift bought units of, with the unit label already singular or plural.
    campaign?: { title: string; units: number; unitLabel: string; unitPrice: number } | null;
    // Taleem programme sponsorship as recorded on the donation: the programme name, units, months and per-unit monthly rate.
    sponsorship?: { programme: string; units: number; months: number; monthlyRate: number } | null;
  };
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ownsFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every(field => Object.hasOwn(value, field));
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

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// A donation belongs to exactly one destination: a well-formed appeal XOR a well-formed fund.
function validDestination(appeal: unknown, fund: unknown): boolean {
  const hasFund = fund !== undefined && fund !== null;
  const appealOk = object(appeal) && ownsFields(appeal, ["title", "slug"]) && text(appeal.title) && typeof appeal.slug === "string" && SLUG.test(appeal.slug);
  const fundOk = object(fund) && ownsFields(fund, ["name", "slug"]) && text(fund.name) && typeof fund.slug === "string" && SLUG.test(fund.slug);
  if (hasFund) return fundOk && (appeal === null);
  return appealOk;
}

const MAX_CAMPAIGN_UNITS = 10_000;

function validCampaign(value: unknown): boolean {
  return object(value) && ownsFields(value, ["title", "units", "unitLabel", "unitPrice"]) &&
    text(value.title) && text(value.unitLabel) &&
    typeof value.units === "number" && Number.isSafeInteger(value.units) && value.units >= 1 && value.units <= MAX_CAMPAIGN_UNITS &&
    money(value.unitPrice) && value.unitPrice > 0;
}

const SPONSORSHIP_MONTHS = [1, 3, 6, 12];
const MAX_SPONSORSHIP_UNITS = 50;

function validSponsorship(value: unknown): boolean {
  return object(value) && ownsFields(value, ["programme", "units", "months", "monthlyRate"]) &&
    text(value.programme) &&
    typeof value.units === "number" && Number.isSafeInteger(value.units) && value.units >= 1 && value.units <= MAX_SPONSORSHIP_UNITS &&
    typeof value.months === "number" && SPONSORSHIP_MONTHS.includes(value.months) &&
    money(value.monthlyRate) && value.monthlyRate > 0;
}

/** Fail closed on malformed private financial reads. Never turn a failed read
 * into a new donation or an apparently invalid donor receipt. */
export function isAcknowledgementResponse(value: unknown, expectedReference: string): value is AcknowledgementRecord | { found: false } {
  if (!object(value) || !Object.hasOwn(value, "found")) return false;
  if (value.found === false) return Reflect.ownKeys(value).length === 1;
  if (value.found !== true || !ownsFields(value, ["presentation", "donation"]) ||
      !object(value.presentation) || !object(value.donation)) return false;

  const p = value.presentation;
  const d = value.donation;
  if (!ownsFields(p, ["tone", "heading", "summary", "statusLabel"]) ||
      !ownsFields(d, [
        "referenceNumber", "receiptNumber", "donorName", "givingIntent", "amount",
        "refundedAmount", "recordDate", "providerPaymentId", "appeal",
      ]) ||
      !Object.hasOwn(d, "appeal")) return false;
  if (
    (typeof p.tone !== "string" || !["captured", "pending", "failed", "refunded"].includes(p.tone)) ||
    !text(p.heading) || !text(p.summary) || !text(p.statusLabel) ||
    !text(d.referenceNumber) || d.referenceNumber !== expectedReference ||
    !nullableText(d.receiptNumber) || !text(d.donorName) ||
    !DONATION_INTENTS.some(intent => intent === d.givingIntent) ||
    !money(d.amount) || d.amount <= 0 ||
    !money(d.refundedAmount) || d.refundedAmount > d.amount ||
    !serverTimestamp(d.recordDate) || !nullableText(d.providerPaymentId) ||
    !validDestination(d.appeal, d.fund) ||
    (d.feeContributionAmount !== undefined && !money(d.feeContributionAmount)) ||
    (d.campaign !== undefined && d.campaign !== null && !validCampaign(d.campaign)) ||
    (d.sponsorship !== undefined && d.sponsorship !== null && !validSponsorship(d.sponsorship))
  ) return false;

  if (p.tone === "refunded") return d.refundedAmount === d.amount;
  if (p.tone === "captured") return d.refundedAmount < d.amount;
  return d.refundedAmount === 0;
}
