import { indianFinancialYear } from "@/lib/giving-funds";

// Pure validation for money leaving a fund. Nothing here touches the database.
export const MAX_DISBURSEMENT_PAISE = 1_000_000_000; // 1 crore rupees
const EARLIEST_SPEND_DATE = "2020-01-01";

export type DisbursementInput = {
  fundId: string;
  pool: "ZAKAT" | "NON_ZAKAT";
  amountPaise: number;
  spentOn: string;
  financialYear: string;
  title: string;
  publicSummary: string | null;
  zakatEligibilityBasis: string | null;
};

export type ParseResult = { ok: true; value: DisbursementInput } | { ok: false; error: string };

/** Canonical positive rupee string with at most two decimals to integer paise; never uses floating point. */
export function parseRupeesToPaise(input: unknown, maxPaise = MAX_DISBURSEMENT_PAISE): number | null {
  if (typeof input !== "string" || !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(input)) return null;
  const [rupees = "0", fraction = ""] = input.split(".");
  const paise = BigInt(rupees) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  if (paise < 1n || paise > BigInt(maxPaise)) return null;
  return Number(paise);
}

// Free text shown to the public must not carry contact details or beneficiary identifiers.
export function looksLikePersonalData(text: string): boolean {
  return /@|https?:\/\/|\d[\d\s().-]{7,}\d/.test(text);
}

function istToday(now: Date): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function parseDisbursementInput(raw: Record<string, unknown>, now: Date = new Date()): ParseResult {
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  const fundId = text("fundId");
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(fundId)) return { ok: false, error: "Choose a fund." };
  const pool = raw.pool;
  if (pool !== "ZAKAT" && pool !== "NON_ZAKAT") return { ok: false, error: "Choose whether this is spent from Zakat or non-Zakat money." };
  const amountPaise = parseRupeesToPaise(text("amount"));
  if (amountPaise === null) return { ok: false, error: "Enter a positive amount in rupees with at most two decimals." };
  const spentOn = raw.spentOn;
  if (!validDate(spentOn) || spentOn < EARLIEST_SPEND_DATE || spentOn > istToday(now)) return { ok: false, error: "Enter a valid spending date that is not in the future." };
  const title = text("title");
  if (title.length < 3 || title.length > 120) return { ok: false, error: "Title must be 3 to 120 characters." };
  const publicSummary = text("publicSummary");
  if (publicSummary.length > 400) return { ok: false, error: "Public summary must be 400 characters or fewer." };
  if (looksLikePersonalData(title) || looksLikePersonalData(publicSummary)) return { ok: false, error: "Remove contact details and identifiers; titles and summaries are public." };
  let zakatEligibilityBasis: string | null = null;
  if (pool === "ZAKAT") {
    zakatEligibilityBasis = text("zakatEligibilityBasis");
    if (raw.zakatEligibilityConfirmed !== true) return { ok: false, error: "Confirm that every recipient of Zakat money is Zakat-eligible." };
    if (zakatEligibilityBasis.length < 10 || zakatEligibilityBasis.length > 500) return { ok: false, error: "Record the basis for eligibility (10 to 500 characters)." };
  }
  return {
    ok: true,
    value: { fundId, pool, amountPaise, spentOn, financialYear: indianFinancialYear(new Date(`${spentOn}T00:00:00+05:30`)), title, publicSummary: publicSummary || null, zakatEligibilityBasis },
  };
}

export function validPublishableSummary(summary: string | null): summary is string {
  return typeof summary === "string" && summary.trim().length >= 10 && summary.length <= 400 && !looksLikePersonalData(summary);
}

export function validVoidReason(reason: unknown): reason is string {
  return typeof reason === "string" && reason.trim().length >= 5 && reason.trim().length <= 500;
}
