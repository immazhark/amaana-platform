import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Compliance and Registration",
  description: "Current domestic-donation, FCRA, provisional 12A and provisional 80G disclosures for Amaana Foundation, stated conservatively from confirmed records.",
  alternates: { canonical: "/compliance" },
  openGraph: {
    type: "website",
    url: "/compliance",
    title: "Compliance and Registration | Amaana Foundation",
    description: "Current domestic-donation, FCRA, provisional 12A and provisional 80G disclosures for Amaana Foundation.",
  },
  twitter: {
    card: "summary",
    title: "Compliance and Registration | Amaana Foundation",
    description: "Amaana Foundation's current public compliance position and donation boundaries.",
  },
};

export default function CompliancePage() {
  return <div className="v2-home v2-compliance-page">
    <PageHero
      variant="trust"
      eyebrow="Trust & Policies"
      title="Clarity before claims."
      description={<p>This page explains Amaana Foundation&apos;s current donation and tax-registration position using only what is presently confirmed. Provisional approvals are described as provisional, and operational tax-certificate controls remain separate from registration status.</p>}
      actions={[
        { label: "See current position", href: "#current-position" },
        { label: "Transparency approach", href: "/transparency", secondary: true },
      ]}
      visualKicker="Registration & Compliance"
      visualTitle="Domestic donations only"
      visualNote="No FCRA registration · provisional 12A and 80G approvals · conservative public claims."
    />

    <section className="v2-compliance-strip"><div className="v2-shell"><article><span>Domestic giving</span><strong>Accepted</strong><p>Through supported Indian payment methods.</p></article><article><span>Foreign contribution</span><strong>Not accepted</strong><p>Amaana Foundation is not presently FCRA-registered.</p></article><article><span>12A &amp; 80G</span><strong>Provisional approvals</strong><p>Both approvals are in place on a provisional basis.</p></article><article><span>Tax certificate</span><strong>Not enabled</strong><p>Normal donation acknowledgements only at present.</p></article></div></section>

    <section className="v2-section paper" id="current-position"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Current public position</p><h2 className="v2-section-title">What Amaana can state today.</h2></div><p className="v2-section-intro">These disclosures are intentionally narrower than a marketing claim. They are designed to stay accurate as the Foundation&apos;s compliance position evolves.</p></div><div className="v2-compliance-ledger"><article><span>01</span><div><small>Donations</small><h3>Domestic Indian sources only</h3><p>Amaana Foundation currently accepts donations only from domestic Indian sources through supported Indian payment methods.</p></div></article><article><span>02</span><div><small>FCRA</small><h3>Foreign contributions are not invited or accepted</h3><p>Amaana Foundation is not presently registered under the Foreign Contribution (Regulation) Act. The platform therefore does not invite or accept foreign contributions.</p></div></article><article><span>03</span><div><small>Sections 12A &amp; 80G</small><h3>Provisional approvals are in place</h3><p>Amaana Foundation has provisional approval under Section 12A and provisional approval under Section 80G. The 80G approval was issued through Form 10AC dated 26 January 2026, covering Assessment Years 2026–27 through 2028–29.</p></div></article><article><span>04</span><div><small>Donation acknowledgements</small><h3>No 80G tax-deduction certificate is issued by the platform</h3><p>The platform currently issues normal donation acknowledgements only. These acknowledgements do not claim or certify eligibility for an income-tax deduction under Section 80G.</p></div></article></div></div></section>

    <section className="v2-section dark v2-compliance-pending"><div className="v2-shell v2-compliance-pending-grid"><div><p className="v2-section-label">Current registration position</p><h2 className="v2-section-title">Provisional approvals are stated without overstating them.</h2><p className="v2-section-intro">Amaana Foundation&apos;s 12A and 80G approvals are both provisional. The site therefore avoids describing either approval as final or permanent, while the Foundation continues to follow the applicable compliance and renewal requirements.</p></div><div className="v2-compliance-hold"><span>Control currently applied</span><strong>Tax-certificate functionality remains disabled.</strong><p>Registration status and platform certificate issuance are treated separately. Normal donation acknowledgements remain the only automated donor document until the required operational and tax-certificate controls are completed.</p></div></div></section>

    <section className="v2-section v2-compliance-guardrails"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Public guardrails</p><h2 className="v2-section-title">What the platform refuses to imply.</h2></div><p className="v2-section-intro">Trust is strengthened by making the limits visible instead of burying them in small print.</p></div><div className="v2-compliance-guardrail-grid"><article><span>01</span><h3>No FCRA claim</h3><p>Foreign contributions are not solicited or accepted.</p></article><article><span>02</span><h3>No final/permanent approval claim</h3><p>The current 12A and 80G approvals are presented as provisional, not permanent.</p></article><article><span>03</span><h3>No automatic tax promise</h3><p>A normal acknowledgement is not described as a deduction certificate.</p></article><article><span>04</span><h3>No assumptions beyond confirmed records</h3><p>The public site states the confirmed provisional approvals without extending them into claims that have not been established.</p></article></div></div></section>

    <section className="v2-compliance-note"><div className="v2-shell"><strong>Tax note</strong><p>Donors should obtain independent tax advice for their individual circumstances.</p></div></section>

    <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Trust should be inspectable</p><h2>See the work, the evidence and the boundaries together.</h2><p>Compliance is one part of trust. Continue into Amaana&apos;s verification and transparency journeys for the wider accountability picture.</p><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/transparency">Explore transparency</Link><Link className="v2-text-link" href="/how-we-verify">How we verify →</Link></div></div></section>
  </div>;
}
