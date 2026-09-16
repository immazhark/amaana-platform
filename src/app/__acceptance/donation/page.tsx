import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browser Acceptance Fixture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function BrowserDonationAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v2-home v2-donate-page">
      <section className="v2-section paper" aria-labelledby="donation-fixture-heading">
        <div className="v2-shell v2-donate-layout">
          <aside className="v2-donate-guide">
            <p className="v2-section-label">Browser acceptance fixture</p>
            <h1 id="donation-fixture-heading">Mocked donation journey</h1>
            <p>
              This route exists only while the isolated browser-acceptance server is running.
              Network boundaries are mocked; it must never create a real payment or donation record.
            </p>
          </aside>
          <div>
            <DonationForm
              appealId="browser-acceptance-appeal"
              appealTitle="Browser Acceptance Appeal"
              maxAmount={5000}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
