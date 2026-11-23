import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { donationFormCopy } from "@/components/donation-form-copy";
import { DonatePageView, donateHeroActions, donateHeroPanel } from "./donate-page-view";

const paymentDetails = { upi: { id: "verified@upi", qrImageUrl: null }, bank: null };
const choice = (id: string, maxAmount = 12_000) => ({
  id, slug: id, title: `Reviewed ${id}`, maxAmount, zakatEligible: false, copy: donationFormCopy(false),
});
const view = (choices: ReturnType<typeof choice>[], fundGivingEnabled = false) => renderToStaticMarkup(
  <DonatePageView choices={choices} impactItems={[]} paymentDetails={paymentDetails} fundGivingEnabled={fundGivingEnabled} />,
);

describe("donate hero actions", () => {
  it("leads to the checkout when an appeal is open", () => {
    expect(donateHeroActions(true, false)).toEqual([
      { label: "Give to a verified appeal", href: "#choose-appeal-checkout" },
      { label: "Explore Taleem sponsorship", href: "/get-involved/sponsor-education", secondary: true },
    ]);
  });

  it("sends visitors to the public appeals, never to a missing checkout, when none is open", () => {
    const actions = donateHeroActions(false, false);
    expect(actions[0]).toEqual({ label: "View verified appeals", href: "/appeals" });
    expect(actions.some(action => action.href.startsWith("#"))).toBe(false);
  });

  it("puts the fund route first only when fund giving is enabled", () => {
    expect(donateHeroActions(true, true)[0]).toEqual({ label: "Choose a fund", href: "/give" });
    expect(donateHeroActions(true, false).some(action => action.href === "/give")).toBe(false);
    expect(donateHeroActions(false, false).some(action => action.href === "/give")).toBe(false);
  });

  it("never offers a generic non-giving action on the donation page", () => {
    for (const open of [true, false]) {
      for (const funds of [true, false]) {
        const labels = donateHeroActions(open, funds).map(action => action.label);
        expect(labels).not.toContain("Explore Our Work");
        expect(labels).not.toContain("Contact Amaana");
      }
    }
  });
});

describe("donate hero panel", () => {
  it("states what is open with a count only, no totals or promises", () => {
    expect(donateHeroPanel(1)).toEqual({
      title: "Open for support today",
      note: "1 reviewed appeal is accepting gifts. Domestic INR only, with secure checkout on this page.",
    });
    expect(donateHeroPanel(3).note).toContain("3 reviewed appeals are accepting gifts");
    expect(donateHeroPanel(2).note).not.toMatch(/₹/);
  });

  it("signals that fund giving is open even when no individual appeal is payable", () => {
    const panel = donateHeroPanel(0, true);
    expect(panel.title).toBe("Fund Giving Is Open");
    expect(panel.note).toContain("Choose an approved fund");
    expect(panel.note).not.toContain("ask Amaana about an approved programme route");
  });

  it("does not claim an open appeal when there is none", () => {
    const panel = donateHeroPanel(0);
    expect(panel.title).toBe("Support Responsibly");
    expect(panel.note).not.toMatch(/accepting gifts|secure checkout/i);
  });
});

describe("donate page view", () => {
  it("renders the checkout once, with a giving action first and no repeated route sermon", () => {
    const html = view([choice("first")]);
    expect(html.match(/id="choose-appeal-checkout"/g)).toHaveLength(1);
    expect(html).toContain("Give to a verified appeal");
    expect(html).not.toContain("Explore Our Work");
    expect(html).not.toContain("Choose where your support should go.");
    expect(html).not.toContain("Choose the route that matches your intention");
    expect(html).toContain("Domestic donations only");
  });

  it("omits the checkout section entirely when no appeal is payable", () => {
    const html = view([]);
    expect(html).not.toContain("choose-appeal-checkout");
    expect(html).toContain("View verified appeals");
    expect(html).toContain("Find an Approved Way to Support.");
  });

  it("never implies donations are unavailable when the active fund route can accept gifts", () => {
    const html = view([], true);
    expect(html).toContain("Choose a Fund. Give With Purpose.");
    expect(html).toContain("Fund giving is open");
    expect(html).toContain('href="/give"');
    expect(html).not.toContain("No reviewed on-page checkout is currently available");
    expect(html).not.toContain("Find an Approved Way to Support.");
  });

  it("distinguishes available Taleem programme giving from the school and college enquiry route", () => {
    const html = view([], true);
    expect(html).toContain("School and college support starts with an enquiry");
    expect(html).toContain("Programme availability and terms are shown on the Taleem page");
    expect(html).not.toContain("Taleem sponsorship and programme giving are arranged only when Amaana confirms an approved destination.");
  });

  it("shows the fund route only when enabled", () => {
    expect(view([choice("first")], false)).not.toContain('href="/give"');
    expect(view([choice("first")], true)).toContain('href="/give"');
  });
});
