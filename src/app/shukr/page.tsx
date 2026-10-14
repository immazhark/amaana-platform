import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { listReviewedDonorRecognition } from "@/lib/donor-recognition-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Shukr — Gratitude and Trust",
  description: "Amaana Foundation's optional, consent-reviewed gratitude recognition. Donor names appear only after individual permission and review.",
  alternates: { canonical: "/shukr" },
  openGraph: { type: "website", url: "/shukr", title: "Shukr | Amaana Foundation",
    description: "A privacy-first space for gratitude, with donor names shown only by explicit choice." },
};
export default async function ShukrPage() {
  const entries = await listReviewedDonorRecognition();
  return <div className="v2-home">
    <PageHero variant="information" eyebrow="Shukr · Gratitude · Choice"
      title="Gratitude without obligation."
      description={<p>Amaana appreciates every sincere contribution, including anonymous support. Public acknowledgement is always optional, reviewed separately and removable.</p>}
      actions={[{ label: "Explore our impact", href: "/impact" },
        { label: "Support responsibly", href: "/donate", secondary: true }]}
      visualKicker="Privacy before publicity" visualTitle="Recognition is a choice."
      visualNote="No payment totals · No case details · No automatic name publication"/>
    <section className="v2-section paper">
      <div className="v2-shell">
        <SectionHeading eyebrow="Shukr, with permission"
          title="Only names voluntarily cleared for recognition."
          subtitle="An eligible donor may make a separate request from their private receipt. A staff review and continued consent are required before display."/>
        {entries.length ? <ul className="v2-card-grid" aria-label="Donors who approved name recognition">
          {entries.map((entry, index) => <li className="v2-card" key={index}>
            <span className="v2-section-label">With gratitude</span>
            <strong>{entry.name}</strong>
          </li>)}
        </ul> : <p>No donor names are publicly listed. This does not imply any absence of generous or anonymous support.</p>}
      </div>
    </section>
    <section className="v2-section amaana-bg-body"><div className="v2-shell">
      <SectionHeading eyebrow="Your choice" title="Anonymous support is equally valued."
        subtitle="No donation, assistance service, receipt or programme participation depends on granting public recognition. To withdraw an approved name, use your private acknowledgement or contact Amaana."/>
      <div className="v2-hero-actions"><Link className="v2-button" href="/contact/feedback">Request help with recognition or privacy</Link>
        <Link className="v2-text-link" href="/privacy">Privacy notice →</Link></div>
    </div></section>
  </div>;
}
