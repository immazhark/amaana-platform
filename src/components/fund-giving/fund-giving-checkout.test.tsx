import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { fundDonationFormCopy, type GiveFund } from "./fund-copy";
import { FundGivingCheckout } from "./fund-giving-checkout";
import { FundGlyph, fundGlyphs } from "./fund-glyphs";

const funds: GiveFund[] = [
  { slug: "general", name: "General Fund", summary: "Used where the need is greatest.", zakatPolicy: "ACCEPTED", isGeneral: true },
  { slug: "orphan", name: "Orphan Fund", summary: "Scholarships and essentials for orphaned children.", zakatPolicy: "ACCEPTED", isGeneral: false },
  { slug: "eid-kits", name: "Eid Kits Fund", summary: "Eid gift kits for families in need.", zakatPolicy: "NOT_ACCEPTED", isGeneral: false },
  { slug: "madarsa-operations", name: "Madarsa Operations Fund", summary: "Teacher salaries and running costs.", zakatPolicy: "UNDER_REVIEW", isGeneral: false },
  { slug: "foundation-operations", name: "Foundation Operations Fund", summary: "Administration and recurring costs.", zakatPolicy: "NOT_ACCEPTED", isGeneral: false },
];
const paymentDetails = { upi: { id: "x@bank", qrImageUrl: null }, bank: null } as unknown as DonationPaymentDetails;
const radios = (html: string) => (html.match(/<input[^>]*>/g) ?? []).filter(tag => tag.includes('name="fund"'));
const checked = (html: string) => radios(html).filter(tag => tag.includes('checked=""')).map(tag => /value="([^"]+)"/.exec(tag)?.[1]);
const render = (initialSlug?: string) => renderToStaticMarkup(<FundGivingCheckout funds={funds} glyphs={fundGlyphs(funds)} copies={Object.fromEntries(funds.map(fund => [fund.slug, fundDonationFormCopy(fund)]))} initialSlug={initialSlug} paymentDetails={paymentDetails} feeBps={236} />);

describe("fund giving checkout", () => {
  it("offers every fund as a native radio in one named group, with the General Fund selected by default", () => {
    const html = render();
    expect(radios(html)).toHaveLength(funds.length);
    expect(radios(html).every(tag => tag.includes('type="radio"'))).toBe(true);
    expect(checked(html)).toEqual(["general"]);
    expect(html).toContain("<legend");
    expect(html).toContain("Choose where your gift goes");
  });

  it("renders the exact existing decorative glyphs supplied by the server, including unknown fund artwork", () => {
    const allFunds = [...funds, { ...funds[0]!, slug: "future-fund", isGeneral: false }];
    const html = renderToStaticMarkup(<FundGivingCheckout funds={allFunds} glyphs={fundGlyphs(allFunds)} copies={Object.fromEntries(allFunds.map(fund => [fund.slug, fundDonationFormCopy(fund)]))} paymentDetails={paymentDetails} feeBps={236} />);
    for (const fund of allFunds) expect(html).toContain(renderToStaticMarkup(<FundGlyph slug={fund.slug} />));
    expect(html.match(/<svg[^>]*aria-hidden="true"[^>]*focusable="false"/g)).toHaveLength(allFunds.length);
  });

  it("labels each fund's Zakat position visibly, not by colour alone", () => {
    const html = render();
    expect(html.match(/Zakat accepted/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Non-Zakat only");
  });

  it("states the Zakat refusal prominently for a fund that does not take Zakat", () => {
    const html = render("eid-kits");
    expect(checked(html)).toEqual(["eid-kits"]);
    expect(html).toContain("Zakat is not accepted for this fund");
    expect(html).toContain("Please note:");
  });

  it("tells donors a fund under review does not yet take Zakat, and never shows a notice for an accepting fund", () => {
    expect(render("madarsa-operations")).toContain("under review");
    expect(render("orphan")).not.toContain("Zakat is not accepted for this fund");
  });

  it("keeps running costs in their own, separately explained section", () => {
    const html = render();
    expect(html).toContain("kept separate from every cause above");
    expect(html.indexOf("Foundation Operations Fund")).toBeGreaterThan(html.indexOf("kept separate"));
  });

  it("falls back to the General Fund for an unknown deep link", () => {
    expect(checked(render("../../etc/passwd"))).toEqual(["general"]);
    expect(checked(render("missing"))).toEqual(["general"]);
  });

  it("shows the fallback-purpose disclosure and opens no payment form until the donor asks", () => {
    const html = render();
    expect(html).toContain("nearest similar purpose");
    expect(html).toContain("Zakat is never moved to a different purpose without your permission");
    expect(html).not.toContain("donation-form-heading");
    expect(html).toContain('aria-expanded="false"');
  });

  it("announces the selected fund to assistive technology", () => {
    expect(render("orphan")).toContain("Selected fund: Orphan Fund. Zakat accepted.");
  });
});

describe("fund donation form copy", () => {
  const intents = (fund: GiveFund) => (renderToStaticMarkup(<>{fundDonationFormCopy(fund).intentionOptions}</>).match(/value="([A-Z]+)"/g) ?? []).map(match => match.slice(7, -1));
  it("offers Zakat only where the fund accepts it", () => {
    expect(intents(funds[0]!)).toEqual(["GENERAL", "SADAQAH", "ZAKAT"]);
    for (const fund of funds.slice(2)) expect(intents(fund)).toEqual(["GENERAL", "SADAQAH"]);
  });
  it("does not talk about an appeal", () => {
    const html = renderToStaticMarkup(<>{fundDonationFormCopy(funds[1]!).heading}{fundDonationFormCopy(funds[1]!).intentIntroduction}</>);
    expect(html).not.toMatch(/appeal/i);
    expect(html).toContain("Orphan Fund");
  });
});

describe("seasonal campaign on the giving page", () => {
  const campaign = { slug: "eid-kits-2027", fundSlug: "eid-kits", title: "Eid Kits 2027", unitLabel: "kit", unitLabelPlural: "kits", unitPrice: 1500, maxUnits: 100, note: "Packed before Eid.", closesLabel: "24 February 2027" };
  const withCampaign = (initialSlug?: string) => renderToStaticMarkup(<FundGivingCheckout funds={funds} glyphs={fundGlyphs(funds)} copies={Object.fromEntries(funds.map(fund => [fund.slug, fundDonationFormCopy(fund)]))} campaigns={[campaign]} initialSlug={initialSlug} paymentDetails={paymentDetails} feeBps={236} />);

  it("offers fixed-price units on the campaign's fund, with the price, the close date and the exact total", () => {
    const html = withCampaign("eid-kits");
    expect(html).toContain("Eid Kits 2027");
    expect(html).toContain("₹1,500 per kit");
    expect(html).toContain("open until 24 February 2027");
    expect(html).toContain("Packed before Eid.");
    expect(html).toContain("Sponsor kits");
    expect(html).toContain("Give another amount");
    expect(html).toMatch(/1 kit × ₹1,500 = <strong>₹1,500<\/strong>/);
    expect(html).toContain("Give ₹1,500 to Eid Kits Fund");
  });
  it("starts in sponsor mode with one unit and labelled stepper controls", () => {
    const html = withCampaign("eid-kits");
    const modes = (html.match(/<input[^>]*name="giftMode"[^>]*>/g) ?? []);
    expect(modes).toHaveLength(2);
    expect(modes.filter(tag => tag.includes('checked=""'))).toHaveLength(1);
    expect(html).toContain('aria-label="Fewer kits"');
    expect(html).toContain('aria-label="More kits"');
    expect(html).toContain("Number of kits");
  });
  it("shows nothing for a fund that has no open campaign", () => {
    const html = withCampaign("orphan");
    expect(html).not.toContain("Sponsor kits");
    expect(html).not.toContain("giftMode");
    expect(html).toContain("Give to Orphan Fund");
  });
  it("is unchanged when no campaign is open at all", () => {
    expect(render("eid-kits")).not.toContain("giftMode");
  });
  it("keeps the Zakat refusal visible alongside the campaign", () => {
    expect(withCampaign("eid-kits")).toContain("Zakat is not accepted for this fund");
  });
});
