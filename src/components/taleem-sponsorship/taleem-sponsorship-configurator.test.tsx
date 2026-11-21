import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/donation-methods", () => ({ DonationMethods: () => <div>Existing payment methods</div> }));

import { fundDonationFormCopy } from "@/components/fund-giving/fund-copy";
import { sponsorshipOffer } from "@/lib/taleem-sponsorship";
import { TaleemSponsorshipConfigurator } from "./taleem-sponsorship-configurator";

const fund = { slug: "taleem", name: "Taleem Fund", summary: "Qur'an and Islamic education.", zakatPolicy: "ACCEPTED" as const, isGeneral: false };
const details = { upi: { id: "synthetic@bank", qrImageUrl: null }, bank: null } as never;
const html = () => renderToStaticMarkup(<TaleemSponsorshipConfigurator fund={fund} offer={sponsorshipOffer()} intro={<p>Your gift supports the Taleem programme and its teaching. It does not name or reserve a student. The period you choose is paid once; it is not a monthly subscription.</p>} panelNote={<p>Months are a prepaid period, not a recurring mandate. Zakat is never moved to a different purpose without your permission.</p>} copy={fundDonationFormCopy(fund)} paymentDetails={details} feeBps={236} />);
const text = () => html().replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Taleem sponsorship configurator", () => {
  it("offers the three approved programmes and the four durations", () => {
    const markup = html();
    for (const name of ["Qaida", "Qur&#x27;an Nazira", "Hifdh — Day Scholar"]) expect(markup).toContain(name);
    for (const months of ["1 month", "3 months", "6 months", "12 months"]) expect(markup).toContain(months);
    expect(markup.match(/name="sponsorshipProgramme"/g)).toHaveLength(3);
    expect(markup.match(/name="sponsorshipMonths"/g)).toHaveLength(4);
  });

  it("starts at one unit of Qaida for one month and shows the exact total", () => {
    const copy = text();
    expect(copy).toContain("1 unit × 1 month × ₹1,000 = ₹1,000");
    expect(copy).toContain("Give ₹1,000 to Qaida");
  });

  it("says plainly that the gift supports the programme, names no student, and is paid once", () => {
    const copy = text();
    expect(copy).toMatch(/does not name or reserve a student/);
    expect(copy).toMatch(/paid once; it is not a monthly subscription/);
    expect(copy).toMatch(/Months are a prepaid period, not a recurring mandate/);
  });

  it("makes no promise of an identified child, a reserved place or a recurring charge", () => {
    const copy = text();
    for (const forbidden of [/your child/i, /sponsor a (child|student)/i, /adopt/i, /reserved for you/i, /auto-?renew/i, /every month/i, /cancel anytime/i]) {
      expect(copy).not.toMatch(forbidden);
    }
  });

  it("does not open the payment forms until the donor asks to give", () => {
    const markup = html();
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Existing payment methods");
  });

  it("states the Zakat rule that applies to Taleem gifts", () => {
    expect(text()).toMatch(/Zakat is never moved to a different purpose without your permission/);
  });
});
