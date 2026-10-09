import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonationMethods } from "@/components/donation-methods";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Direct Donation Browser Acceptance Fixture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function DirectDonationAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v2-home v2-donate-page">
      <section className="v2-section paper" aria-labelledby="direct-donation-fixture-heading">
        <div className="v2-shell v2-donate-layout">
          <aside className="v2-donate-guide">
            <p className="v2-section-label">Browser acceptance fixture</p>
            <h1 id="direct-donation-fixture-heading">Mocked multi-method donation journey</h1>
            <p>
              This route exists only for isolated browser acceptance. No real payment,
              transfer, upload or donation record is created.
            </p>
          </aside>
          <div>
            <DonationMethods
              appealId="browser-acceptance-appeal"
              appealTitle="Browser Acceptance Appeal"
              maxAmount={5000}
              zakatEligible
              paymentDetails={{
                upi: { id: "mab.037347029220157@axisbank", qrImageUrl: null },
                bank: {
                  accountName: "AMAANA FOUNDATION",
                  accountNumber: "925020008040264",
                  ifsc: "UTIB0002922",
                  bankName: "Axis Bank",
                  branch: "MEHDIPATNAM",
                },
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
