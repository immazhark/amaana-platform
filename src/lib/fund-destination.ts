import { campaignIsOpen, checkCampaignGift, type CampaignStatusId } from "@/lib/fund-campaign";
import { isIntentAllowedForFund, zakatNoticeForFund, type FundZakatPolicyId } from "@/lib/giving-funds";
import type { OrderDestination } from "@/lib/donation-order";
import { isCheckoutEnabled, quoteSponsorship, sponsorshipRecord, TALEEM_FUND_SLUG, type QuoteFailure } from "@/lib/taleem-sponsorship";

type FundRow = { id: string; slug: string; name: string; zakatPolicy: FundZakatPolicyId; isGeneral: boolean };
type CampaignRow = { id: string; unitPrice: { toNumber(): number } | number; maxUnits: number; status: CampaignStatusId; opensAt: Date; closesAt: Date };
type FundClient = {
  fund: { findFirst(args: { where: { slug: string; status: "ACTIVE" }; select: { id: true; slug: true; name: true; zakatPolicy: true; isGeneral: true } }): Promise<FundRow | null> };
  fundCampaign?: { findFirst(args: { where: { slug: string; fundId: string }; select: { id: true; unitPrice: true; maxUnits: true; status: true; opensAt: true; closesAt: true } }): Promise<CampaignRow | null> };
};

export type FundDestinationResult =
  | { ok: true; value: Extract<OrderDestination, { fundId: string }> }
  | { ok: false; status: 400 | 409; error: string };

export type FundDestinationInput = {
  fundSlug: string; givingIntent: string; donorDirective?: string | undefined;
  campaignSlug?: string | undefined; units?: number | undefined; amount?: number; now?: Date;
  // Taleem programme sponsorship. Closed unless the caller passes sponsorshipEnabled: true (the live flag).
  sponsorship?: { programmeId: string; units: number; months: number } | undefined; sponsorshipEnabled?: boolean | undefined;
};

const SPONSORSHIP_CLOSED = "Taleem sponsorship is not open yet.";
const QUOTE_FAILURE: Record<QuoteFailure, { status: 400 | 409; error: string }> = {
  UNKNOWN_PROGRAMME: { status: 400, error: "Please choose a Taleem programme." },
  PROGRAMME_UNAVAILABLE: { status: 409, error: "This programme is not open for sponsorship right now." },
  INVALID_UNITS: { status: 400, error: "Please choose between 1 and 50 units." },
  INVALID_DURATION: { status: 400, error: "Please choose 1, 3, 6 or 12 months." },
};

// Resolves a donor's chosen fund on the server. Only ACTIVE funds accept gifts, Zakat is refused wherever the
// fund is not ruled ACCEPTED, a free-text request is kept only for the General fund (staff confirm it), and a
// campaign gift must come from an open campaign of this fund at exactly units x its price.
export async function resolveFundDestination(client: FundClient, input: FundDestinationInput): Promise<FundDestinationResult> {
  const fund = await client.fund.findFirst({
    where: { slug: input.fundSlug, status: "ACTIVE" },
    select: { id: true, slug: true, name: true, zakatPolicy: true, isGeneral: true },
  });
  if (!fund) return { ok: false, status: 409, error: "This fund is not accepting donations." };
  if (!isIntentAllowedForFund(fund.zakatPolicy, input.givingIntent)) {
    return { ok: false, status: 409, error: zakatNoticeForFund(fund.zakatPolicy) ?? "This donation type is not available for this fund." };
  }
  const directive = input.donorDirective?.trim() || null;
  if (directive && !fund.isGeneral) return { ok: false, status: 400, error: "A custom request can only be added to the General Fund." };
  const base = { fundId: fund.id, fundSlug: fund.slug, title: fund.name, donorDirective: directive };
  if (input.sponsorship) {
    // The programme, units and months are the only inputs; the price is recomputed here from the approved catalogue and
    // the donor's amount must equal it. Never combined with a campaign or a custom request, and only for the Taleem fund.
    if (input.campaignSlug !== undefined || input.units !== undefined || directive) return { ok: false, status: 400, error: "A sponsorship cannot be combined with a campaign or a custom request." };
    if (fund.slug !== TALEEM_FUND_SLUG) return { ok: false, status: 400, error: "Programme sponsorship is only available for the Taleem Fund." };
    if (!input.sponsorshipEnabled) return { ok: false, status: 409, error: SPONSORSHIP_CLOSED };
    const quoted = quoteSponsorship(input.sponsorship);
    if (!quoted.ok) return { ok: false, ...QUOTE_FAILURE[quoted.code] };
    if (!isCheckoutEnabled(quoted.quote)) return { ok: false, status: 409, error: SPONSORSHIP_CLOSED };
    if (input.amount === undefined || input.amount * 100 !== quoted.quote.totalPaise) return { ok: false, status: 409, error: "The sponsorship price has changed. Please reload the page and try again." };
    return { ok: true, value: { ...base, sponsorship: sponsorshipRecord(quoted.quote) } };
  }
  if (input.campaignSlug === undefined && input.units === undefined) return { ok: true, value: base };
  if (input.campaignSlug === undefined || input.units === undefined || !client.fundCampaign) return { ok: false, status: 400, error: "Please choose a campaign and a number of units." };

  const campaign = await client.fundCampaign.findFirst({
    where: { slug: input.campaignSlug, fundId: fund.id },
    select: { id: true, unitPrice: true, maxUnits: true, status: true, opensAt: true, closesAt: true },
  });
  if (!campaign || !campaignIsOpen(campaign, input.now ?? new Date())) return { ok: false, status: 409, error: "This campaign is not open for gifts." };
  const unitPrice = typeof campaign.unitPrice === "number" ? campaign.unitPrice : campaign.unitPrice.toNumber();
  const gift = checkCampaignGift({ unitPrice, maxUnits: campaign.maxUnits }, input.units, input.amount);
  if (!gift.ok) {
    if (gift.code === "PRICE_MISMATCH") return { ok: false, status: 409, error: "The price for this campaign has changed. Please reload the page and try again." };
    return { ok: false, status: 400, error: gift.code === "OVER_LIMIT" ? `A single gift can include at most ${campaign.maxUnits} units.` : "Please enter a whole number of units." };
  }
  return { ok: true, value: { ...base, campaignId: campaign.id, units: gift.units, unitPrice } };
}
