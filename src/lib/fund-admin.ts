import { looksLikePersonalData } from "@/lib/fund-disbursement";
import type { FundZakatPolicyId } from "@/lib/giving-funds";

// Pure validation for creating and editing designated funds. Nothing here touches the database.
export const FUND_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "CLOSED"] as const;
export const FUND_ZAKAT_POLICIES = ["ACCEPTED", "NOT_ACCEPTED", "UNDER_REVIEW"] as const;
export type FundStatusId = (typeof FUND_STATUSES)[number];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["admin", "api", "give", "funds", "new"]);

export type FundFields = { name: string; summary: string; zakatPolicy: FundZakatPolicyId; status: FundStatusId; sortOrder: number };
export type CreateFundInput = FundFields & { slug: string; zakatBasis: string | null };
export type UpdateFundInput = FundFields & { zakatBasis: string | null };
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (raw: Record<string, unknown>, key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");

function parseFields(raw: Record<string, unknown>): Parsed<FundFields> {
  const name = text(raw, "name");
  if (name.length < 3 || name.length > 80) return { ok: false, error: "Name must be 3 to 80 characters." };
  const summary = text(raw, "summary");
  if (summary.length < 10 || summary.length > 200) return { ok: false, error: "Summary must be 10 to 200 characters." };
  // Name and summary are shown publicly on the giving page and the public ledger.
  if (looksLikePersonalData(name) || looksLikePersonalData(summary)) return { ok: false, error: "Remove contact details and identifiers; the name and summary are public." };
  const zakatPolicy = raw.zakatPolicy;
  if (!(FUND_ZAKAT_POLICIES as readonly unknown[]).includes(zakatPolicy)) return { ok: false, error: "Choose the Zakat position." };
  const status = raw.status;
  if (!(FUND_STATUSES as readonly unknown[]).includes(status)) return { ok: false, error: "Choose a status." };
  const sortText = text(raw, "sortOrder");
  const sortOrder = sortText === "" ? 0 : /^\d{1,4}$/.test(sortText) ? Number(sortText) : NaN;
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000) return { ok: false, error: "Display order must be a whole number from 0 to 1000." };
  return { ok: true, value: { name, summary, zakatPolicy: zakatPolicy as FundZakatPolicyId, status: status as FundStatusId, sortOrder } };
}

export function parseCreateFund(raw: Record<string, unknown>): Parsed<CreateFundInput> {
  const slug = text(raw, "slug");
  if (slug.length < 2 || slug.length > 40 || !SLUG.test(slug)) return { ok: false, error: "Slug must be 2 to 40 characters of lowercase letters, digits and single hyphens." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "That slug is reserved." };
  const fields = parseFields(raw);
  if (!fields.ok) return fields;
  // A new fund never starts as ACCEPTED-for-Zakat without the owner's ruling being recorded on it.
  if (fields.value.zakatPolicy === "ACCEPTED" && text(raw, "zakatBasis").length < 10) return { ok: false, error: "Record the basis for accepting Zakat (10 to 500 characters)." };
  const zakatBasis = fields.value.zakatPolicy === "ACCEPTED" ? text(raw, "zakatBasis") : null;
  if (zakatBasis !== null && zakatBasis.length > 500) return { ok: false, error: "Record the basis for accepting Zakat (10 to 500 characters)." };
  return { ok: true, value: { slug, ...fields.value, zakatBasis } };
}

// Any change to the Zakat position must record why (it is a religious responsibility and is audited).
export function parseUpdateFund(raw: Record<string, unknown>, current: { zakatPolicy: FundZakatPolicyId }): Parsed<UpdateFundInput> {
  const fields = parseFields(raw);
  if (!fields.ok) return fields;
  const basis = text(raw, "zakatBasis");
  const changed = fields.value.zakatPolicy !== current.zakatPolicy;
  if (changed && (basis.length < 10 || basis.length > 500)) return { ok: false, error: "A change to the Zakat position needs its basis recorded (10 to 500 characters)." };
  return { ok: true, value: { ...fields.value, zakatBasis: changed ? basis : null } };
}

export function validFundId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,64}$/.test(value);
}
