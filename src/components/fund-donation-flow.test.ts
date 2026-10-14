import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/script", () => ({ default: () => createElement("span", { "data-gateway-script": "loaded" }) }));
import { DonationForm } from "./donation-form";
import { FundDonationFlow } from "./fund-donation-flow";
const fund = { id: "fund", revision: 4, name: "Reviewed fund", purpose: "A reviewed charitable purpose for the programme.", disclosure: "Support stays restricted to the reviewed charitable purpose.", acceptedIntents: ["SADAQAH"] as const };
describe("fund donor form rendering", () => {
  it("renders original purpose with explicit confirmation and only accepted intentions", () => {
    const html = renderToStaticMarkup(createElement(DonationForm, { fund, maxAmount: 1_000_000 }));
    expect(html).toContain(fund.purpose); expect(html).toContain(fund.disclosure);
    expect(html).toContain('name="fundPurposeConfirmed"'); expect(html).toContain('required=""');
    expect(html).toContain('value="SADAQAH"'); expect(html).not.toContain('value="GENERAL"'); expect(html).not.toContain('value="ZAKAT"');
    expect(html).toContain("data-gateway-script");
  });
  it("preserves appeal-only rendering without fund confirmation", () => {
    const html = renderToStaticMarkup(createElement(DonationForm, { appealId: "appeal", appealTitle: "Verified appeal", maxAmount: 100, zakatEligible: true }));
    expect(html).toContain('value="ZAKAT"'); expect(html).not.toContain('name="fundPurposeConfirmed"');
    expect(html).toContain("data-gateway-script");
  });
  it("keeps selection and empty-state labels accessible", () => {
    expect(renderToStaticMarkup(createElement(FundDonationFlow, { funds: [] }))).toContain('role="status"');
    const html = renderToStaticMarkup(createElement(FundDonationFlow, { funds: [fund] }));
    expect(html).toContain('for="giving-fund-choice"'); expect(html).toContain('id="giving-fund-choice"');
  });
  it("offers only optional fund amounts within the transaction limit", () => {
    const html = renderToStaticMarkup(createElement(DonationForm, { fund, maxAmount: 1200 }));
    expect(html).toContain('aria-label="Suggested donation amounts"'); expect(html).toContain("₹500"); expect(html).toContain("₹1,000");
    expect(html).not.toContain("₹2,500"); expect(html).not.toContain("₹5,000");
    const amountInput = html.match(/<input[^>]*name="amount"[^>]*>/)?.[0];
    expect(amountInput).toBeDefined(); expect(amountInput).not.toMatch(/\bvalue=/);
    const belowPreset = renderToStaticMarkup(createElement(DonationForm, { fund, maxAmount: 100 }));
    expect(belowPreset).not.toContain('aria-label="Suggested donation amounts"');
    const appeal = renderToStaticMarkup(createElement(DonationForm, { appealId: "appeal", appealTitle: "Verified appeal", maxAmount: 1000 }));
    expect(appeal).not.toContain('aria-label="Suggested donation amounts"');
  });

});
