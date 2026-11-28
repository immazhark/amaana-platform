import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealLandingCheckout } from "./donation-methods";
import { donationFormCopy } from "./donation-form-copy";

const paymentDetails = { upi: { id: "verified@upi", qrImageUrl: null }, bank: null };
const appeals = [
  { id: "approved-first", slug: "approved-first", title: "Approved education", maxAmount: 900, zakatEligible: false, copy: donationFormCopy(false) },
  { id: "approved-second", slug: "approved-second", title: "Approved healthcare", maxAmount: 2_500, zakatEligible: true, copy: donationFormCopy(true) },
];

describe("AF-R083 landing-page donation selection", () => {
  it("renders exactly one reviewed checkout with purpose-specific accessible selection", () => {
    const html = renderToStaticMarkup(<AppealLandingCheckout appeals={appeals} paymentDetails={paymentDetails}/>);
    expect(html).toContain("Continue to payment methods");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('data-reviewed-checkout="');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    // The selected card must be visually distinguishable, not only ARIA-labelled.
    expect(html).toMatch(/<button[^>]*class="[^"]*appealCardSelected[^"]*"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/<button(?![^>]*appealCardSelected)[^>]*aria-pressed="false"/);
    expect(html).toContain("Selected: <strong>Approved education</strong>");
    expect(html).toContain("₹900");
    expect(html).toContain("₹2,500");
    expect(html).toContain("/appeals/approved-first");
    expect(html).toContain("/appeals/approved-second");
  });

  it("keeps the selected-card treatment in the stylesheet, not in inline styles", () => {
    const css = readFileSync(new URL("./donation-methods.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const selected = css.match(/\.appealCardSelected\s*{([^}]*)}/)?.[1] ?? "";
    expect(selected).toContain("box-shadow: inset 0 0 0 1px var(--af-color-gold-ink)");
    expect(selected).toContain("border-color: var(--af-color-gold-ink)");
    const html = renderToStaticMarkup(<AppealLandingCheckout appeals={appeals} paymentDetails={paymentDetails}/>);
    expect(html).not.toMatch(/<section[^>]*style=/);
    expect(html).not.toMatch(/<button[^>]*style=/);
  });

  it("presents one reviewed appeal as a destination rather than a choice", () => {
    const html = renderToStaticMarkup(<AppealLandingCheckout appeals={[appeals[0]!]} paymentDetails={paymentDetails}/>);
    expect(html).toContain("Give to this verified appeal.");
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("You can change your selection");
    expect(html).not.toContain("Choose an appeal and give on this page.");
    expect(html).toContain("₹900 remaining");
    expect(html).toContain("Continue to payment methods");
    expect(html).toContain("/appeals/approved-first");
  });

  it("keeps the choice wording when several appeals are open", () => {
    const html = renderToStaticMarkup(<AppealLandingCheckout appeals={appeals} paymentDetails={paymentDetails}/>);
    expect(html).toContain("Choose an appeal and give on this page.");
    expect(html).not.toContain("Give to this verified appeal.");
  });

  it("omits in-page payment controls when the reviewed appeal list has no payable balance", () => {
    const invalid = [
      { ...appeals[0]!, maxAmount: 0 },
      { ...appeals[1]!, maxAmount: 9.5 },
    ];
    expect(renderToStaticMarkup(<AppealLandingCheckout appeals={invalid} paymentDetails={paymentDetails}/>)).toBe("");
    expect(renderToStaticMarkup(<AppealLandingCheckout appeals={[]} paymentDetails={paymentDetails}/>)).toBe("");
  });
});


it("provides a truthful no-script recovery path without offering another payment destination", () => {
  const markup = renderToStaticMarkup(<AppealLandingCheckout appeals={appeals} paymentDetails={paymentDetails}/>);
  const notice = markup.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
  expect(notice).toContain("Interactive payment options require JavaScript.");
  expect(notice).toContain('href="/contact"');
  expect(notice).toContain('href="/donation-policy"');
  expect(notice).toContain("currently approved donation options");
  expect(notice).not.toMatch(/<form|<input|upi:|rzp_|@bank|@upi/);
});
