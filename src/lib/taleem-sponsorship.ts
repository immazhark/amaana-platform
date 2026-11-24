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

/** A donor's choice as the page quoted it. `fields` are the request field names the order and transfer routes read, so a
 * form sends them as they are; `totalRupees` is the quoted price in whole rupees. The server recomputes the price and refuses a mismatch. */
export type SponsorshipSelection = { fields: { sponsorshipProgramme: TaleemProgrammeId; sponsorshipUnits: number; sponsorshipMonths: number }; totalRupees: number };

/** What the donor-facing configurator is offered, built on the server from the approved catalogue so the client carries no
 * catalogue or pricing code. Rates are whole rupees per unit per month; the server still recomputes every charge. */
export type SponsorshipOffer = {
  programmes: { id: TaleemProgrammeId; name: string; summary: string; monthlyRupees: number }[];
  monthOptions: readonly number[];
  maxUnits: number;
};

export function sponsorshipOffer(catalogue: TaleemCatalogue = TALEEM_CATALOGUE): SponsorshipOffer {
  const programmes = catalogue.programmes
    .filter(item => item.available && item.approval === "APPROVED" && item.monthlyPaise % 100 === 0)
    .map(item => ({ id: item.id, name: item.name, summary: item.summary, monthlyRupees: item.monthlyPaise / 100 }));
  return { programmes, monthOptions: SPONSORSHIP_MONTH_OPTIONS, maxUnits: MAX_SPONSORSHIP_UNITS };
}

/** Programme sponsorship is a gift to this fund and to no other. */
export const TALEEM_FUND_SLUG = "taleem";

/** What is stored on the donation. The rate is per unit per month in whole rupees, recorded with its version, so a later
 * rate change can never rewrite what a donor was quoted. (The engine's monthlyPaise covers all units; this divides it.) */
export type SponsorshipRecord = { programme: TaleemProgrammeId; units: number; months: number; monthlyRate: number; rateVersion: string };

export function sponsorshipRecord(quote: SponsorshipQuote): SponsorshipRecord {
  return { programme: quote.programmeId, units: quote.units, months: quote.months, monthlyRate: quote.monthlyPaise / quote.units / 100, rateVersion: quote.rateVersion };
}

export function sponsorshipColumns(record: SponsorshipRecord) {
  return {
    sponsorshipProgramme: record.programme,
    sponsorshipUnits: record.units,
    sponsorshipMonths: record.months,
    sponsorshipMonthlyRate: record.monthlyRate,
    sponsorshipRateVersion: record.rateVersion,
  };
}

/** The request's programme, units and months, or undefined when the donation is not a sponsorship. */
export function sponsorshipInputFrom(data: { sponsorshipProgramme?: string | undefined; sponsorshipUnits?: number | undefined; sponsorshipMonths?: number | undefined }) {
  return data.sponsorshipProgramme !== undefined && data.sponsorshipUnits !== undefined && data.sponsorshipMonths !== undefined
    ? { programmeId: data.sponsorshipProgramme, units: data.sponsorshipUnits, months: data.sponsorshipMonths }
    : undefined;
}
