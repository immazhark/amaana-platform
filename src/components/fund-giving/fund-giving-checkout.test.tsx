import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { fundDonationFormCopy, type GiveFund } from "./fund-copy";
import { FundGivingCheckout } from "./fund-giving-checkout";

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
const render = (initialSlug?: string) => renderToStaticMarkup(<FundGivingCheckout funds={funds} initialSlug={initialSlug} paymentDetails={paymentDetails} feeBps={236} />);

describe("fund giving checkout", () => {
  it("offers every fund as a native radio in one named group, with the General Fund selected by default", () => {
    const html = render();
    expect(radios(html)).toHaveLength(funds.length);
    expect(radios(html).every(tag => tag.includes('type="radio"'))).toBe(true);
    expect(checked(html)).toEqual(["general"]);
    expect(html).toContain("<legend");
    expect(html).toContain("Choose where your gift goes");
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
