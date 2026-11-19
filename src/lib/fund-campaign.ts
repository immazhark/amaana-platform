import { looksLikePersonalData } from "@/lib/fund-disbursement";

// Pure rules for seasonal fixed-price campaigns. Nothing here touches the database.
export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "CLOSED"] as const;
export type CampaignStatusId = (typeof CAMPAIGN_STATUSES)[number];
export const MAX_CAMPAIGN_UNITS = 1000;
const MAX_WINDOW_DAYS = 120;
const IST_OFFSET_MS = 330 * 60_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LABEL = /^[a-z][a-z ]{1,19}$/;

// What a donor has chosen on the giving page: a number of units of an open campaign. The server re-checks everything.
export type CampaignSelection = { slug: string; units: number; unitPrice: number; unitLabel: string; unitLabelPlural: string };

export type CampaignWindow = { status: CampaignStatusId; opensAt: Date; closesAt: Date };

// A campaign takes gifts only while it is ACTIVE and now is inside [opensAt, closesAt).
export function campaignIsOpen(campaign: CampaignWindow, now: Date): boolean {
  return campaign.status === "ACTIVE" && campaign.opensAt.getTime() <= now.getTime() && now.getTime() < campaign.closesAt.getTime();
}

export type GiftCheck = { ok: true; units: number; total: number } | { ok: false; code: "INVALID_UNITS" | "OVER_LIMIT" | "PRICE_MISMATCH" };

// The server alone decides what a campaign gift costs: the browser's amount must equal units x unit price.
export function checkCampaignGift(campaign: { unitPrice: number; maxUnits: number }, units: unknown, amount: unknown): GiftCheck {
  if (typeof units !== "number" || !Number.isSafeInteger(units) || units < 1) return { ok: false, code: "INVALID_UNITS" };
  if (units > campaign.maxUnits) return { ok: false, code: "OVER_LIMIT" };
  const total = units * campaign.unitPrice;
  if (!Number.isSafeInteger(total) || amount !== total) return { ok: false, code: "PRICE_MISMATCH" };
  return { ok: true, units, total };
}

// "YYYY-MM-DDTHH:mm" in IST (what a datetime-local field submits) to an instant; null if it is not a real time.
export function istLocalToDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  const utc = Date.UTC(y, mo - 1, d, h, mi);
  const probe = new Date(utc);
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d || probe.getUTCHours() !== h || probe.getUTCMinutes() !== mi) return null;
  return new Date(utc - IST_OFFSET_MS);
}

export function dateToIstLocal(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

export type CampaignFields = {
  title: string; unitLabel: string; unitLabelPlural: string; unitPrice: number; maxUnits: number;
  opensAt: Date; closesAt: Date; status: CampaignStatusId; note: string | null;
};
export type CreateCampaignInput = CampaignFields & { fundId: string; slug: string };
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
const text = (raw: Record<string, unknown>, key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");

export function parseCampaignFields(raw: Record<string, unknown>): Parsed<CampaignFields> {
  const title = text(raw, "title");
  if (title.length < 3 || title.length > 80) return { ok: false, error: "Title must be 3 to 80 characters." };
  const unitLabel = text(raw, "unitLabel").toLowerCase();
  const unitLabelPlural = text(raw, "unitLabelPlural").toLowerCase();
  if (!LABEL.test(unitLabel) || !LABEL.test(unitLabelPlural)) return { ok: false, error: "Unit names must be 2 to 20 lowercase letters, for example kit and kits." };
  const priceText = text(raw, "unitPrice");
  if (!/^[1-9]\d{0,6}$/.test(priceText)) return { ok: false, error: "Price per unit must be a whole number of rupees from 1 to 9,999,999." };
  const maxText = text(raw, "maxUnits");
  const maxUnits = /^\d{1,4}$/.test(maxText) ? Number(maxText) : NaN;
  if (!Number.isInteger(maxUnits) || maxUnits < 1 || maxUnits > MAX_CAMPAIGN_UNITS) return { ok: false, error: `Maximum units per gift must be 1 to ${MAX_CAMPAIGN_UNITS}.` };
  const opensAt = istLocalToDate(text(raw, "opensAt"));
  const closesAt = istLocalToDate(text(raw, "closesAt"));
  if (!opensAt || !closesAt) return { ok: false, error: "Enter valid opening and closing times (India time)." };
  if (closesAt.getTime() <= opensAt.getTime()) return { ok: false, error: "The campaign must close after it opens." };
  if (closesAt.getTime() - opensAt.getTime() > MAX_WINDOW_DAYS * 86_400_000) return { ok: false, error: `A campaign window cannot exceed ${MAX_WINDOW_DAYS} days.` };
  const status = raw.status;
  if (!(CAMPAIGN_STATUSES as readonly unknown[]).includes(status)) return { ok: false, error: "Choose a status." };
  const note = text(raw, "note");
  if (note.length > 200) return { ok: false, error: "The note must be 200 characters or fewer." };
  if (looksLikePersonalData(title) || looksLikePersonalData(note)) return { ok: false, error: "Remove contact details and identifiers; the title and note are public." };
  return { ok: true, value: { title, unitLabel, unitLabelPlural, unitPrice: Number(priceText), maxUnits, opensAt, closesAt, status: status as CampaignStatusId, note: note || null } };
}

export function parseCreateCampaign(raw: Record<string, unknown>): Parsed<CreateCampaignInput> {
  const slug = text(raw, "slug");
  if (slug.length < 2 || slug.length > 40 || !SLUG.test(slug)) return { ok: false, error: "Slug must be 2 to 40 characters of lowercase letters, digits and single hyphens." };
  const fundId = text(raw, "fundId");
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(fundId)) return { ok: false, error: "Choose a fund." };
  const fields = parseCampaignFields(raw);
  if (!fields.ok) return fields;
  return { ok: true, value: { slug, fundId, ...fields.value } };
}

// DRAFT may go anywhere; ACTIVE may stay or close; CLOSED is final.
export function statusTransitionAllowed(from: CampaignStatusId, to: CampaignStatusId): boolean {
  if (from === "CLOSED") return to === "CLOSED";
  if (from === "ACTIVE") return to === "ACTIVE" || to === "CLOSED";
  return true;
}
