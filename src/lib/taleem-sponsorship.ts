import { TALEEM_CATALOGUE, type RateApproval, type TaleemCatalogue, type TaleemProgrammeId } from "@/content/taleem-catalogue";

export const SPONSORSHIP_MONTH_OPTIONS = [1, 3, 6, 12] as const;
export const MAX_SPONSORSHIP_UNITS = 50;

export type SponsorshipQuote = {
  programmeId: TaleemProgrammeId;
  units: number;
  months: number;
  monthlyPaise: number;
  totalPaise: number;
  rateVersion: string;
  approval: RateApproval;
};

export type QuoteFailure = "UNKNOWN_PROGRAMME" | "PROGRAMME_UNAVAILABLE" | "INVALID_UNITS" | "INVALID_DURATION";
export type QuoteResult = { ok: true; quote: SponsorshipQuote } | { ok: false; code: QuoteFailure };

// Authoritative server-side calculation. Only programme, units and months are read from the input;
// any client-supplied money field is ignored. All arithmetic is integer paise.
export function quoteSponsorship(input: unknown, catalogue: TaleemCatalogue = TALEEM_CATALOGUE): QuoteResult {
  const record = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const programme = catalogue.programmes.find(item => item.id === record.programmeId);
  if (!programme) return { ok: false, code: "UNKNOWN_PROGRAMME" };
  if (!programme.available) return { ok: false, code: "PROGRAMME_UNAVAILABLE" };
  const { units, months } = record;
  if (typeof units !== "number" || !Number.isSafeInteger(units) || units < 1 || units > MAX_SPONSORSHIP_UNITS) return { ok: false, code: "INVALID_UNITS" };
  if (typeof months !== "number" || !(SPONSORSHIP_MONTH_OPTIONS as readonly number[]).includes(months)) return { ok: false, code: "INVALID_DURATION" };
  const monthlyPaise = programme.monthlyPaise * units;
  const totalPaise = monthlyPaise * months;
  if (!Number.isSafeInteger(totalPaise)) return { ok: false, code: "INVALID_UNITS" };
  return { ok: true, quote: { programmeId: programme.id, units, months, monthlyPaise, totalPaise, rateVersion: catalogue.version, approval: programme.approval } };
}

// Live checkout stays off until the owner approves the rate (directive section 22).
export function isCheckoutEnabled(quote: SponsorshipQuote): boolean {
  return quote.approval === "APPROVED";
}
