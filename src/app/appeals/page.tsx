import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { getAppealsIndexData } from "@/lib/public-page-data";

export const metadata: Metadata = {
  title: "Verified Appeals",
  description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad, with public-safe context and clear donation boundaries.",
  alternates: { canonical: "/appeals" },
  openGraph: {
    type: "website",
    url: "/appeals",
    title: "Verified Appeals | Amaana Foundation",
    description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad, with public-safe context and clear donation boundaries.",
  },
  twitter: {
    card: "summary",
    title: "Verified Appeals | Amaana Foundation",
    description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad.",
  },
};

export const dynamic = "force-dynamic";

export default async function AppealsPage() {
  const appeals = await getAppealsIndexData();

  return (
    <div className="v2-home v2-appeals-page">
      <section className="v2-appeals-hero">
        <div className="v2-shell v2-appeals-hero-grid">
          <div>
            <p className="v2-section-label">Verified appeals · Hyderabad</p>
            <h1>Understand the need before you give.</h1>
            <p>Amaana does not publish every request it receives. Public appeals are the final step of a private review process, with only the information needed to understand the case made visible.</p>
            <div className="v2-hero-actions"><a className="v2-button" href="#current-appeals">See current appeals</a><Link className="v2-text-link" href="/how-we-verify">How verification works →</Link></div>
          </div>
          <div className="v2-appeals-hero-seal" aria-hidden="true"><span>Private review</span><strong>Amanah</strong><span>Public-safe appeal</span></div>
        </div>
      </section>

      <section className="v2-appeals-trustline" aria-label="Appeal review journey"><div className="v2-shell"><span>Need received</span><b aria-hidden="true">→</b><span>Information reviewed</span><b aria-hidden="true">→</b><span>Decision made</span><b aria-hidden="true">→</b><span>Public-safe appeal</span><b aria-hidden="true">→</b><span>Known outcome recorded</span></div></section>

      <section className="v2-section paper" id="current-appeals">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Current appeals</p><h2 className="v2-section-title">Give where a reviewed need is active.</h2></div>
            <p className="v2-section-intro">Donations are currently limited to India. Amaana does not accept foreign contributions because the Foundation is not FCRA-registered.</p>
          </div>

          {appeals.length ? <div className="v2-appeals-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div> : <div className="v2-appeals-empty"><span className="v2-section-label">No active public appeal right now</span><h3>We will not manufacture urgency just to keep a donate button active.</h3><p>When no reviewed need is open, there is no checkout to push you into. You can still see completed work, read documented outcomes and understand how Amaana handles trust.</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore completed work</Link><Link className="v2-text-link" href="/stories">Read Stories of Amanah →</Link></div></div>}
        </div>
      </section>

      <section className="v2-section dark v2-appeal-method">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Before fundraising</p><h2 className="v2-section-title">A request becomes an appeal only after review.</h2></div><p className="v2-section-intro">The public should be able to understand how a case reached the fundraising stage without the beneficiary having to surrender their privacy to prove their need.</p></div>
          <div className="v2-appeal-method-grid">
            <article><span>01</span><h3>Request</h3><p>The circumstances and requested assistance are received privately.</p></article>
            <article><span>02</span><h3>Review</h3><p>Relevant supporting information and known circumstances are checked.</p></article>
            <article><span>03</span><h3>Decision</h3><p>The team decides whether and how Amaana can responsibly support the need.</p></article>
            <article><span>04</span><h3>Publication</h3><p>Only approved information necessary to explain the need becomes public.</p></article>
            <article><span>05</span><h3>Closure</h3><p>Known outcomes and updates are recorded without inventing what is not known.</p></article>
          </div>
        </div>
      </section>

      <section className="v2-section v2-appeals-boundary"><div className="v2-shell v2-appeals-boundary-grid"><div><p className="v2-section-label">Dignity boundary</p><h2 className="v2-section-title">Proof does not have to become spectacle.</h2></div><div><p>Medical records, identity documents, bank details and other private verification material stay outside the public experience. The website should establish trust through process, context, approved outcomes and accountable reporting — not by exposing people at vulnerable moments.</p><Link className="v2-text-link" href="/transparency">See our transparency approach →</Link></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Need assistance?</p><h2>Requests begin privately, not as public appeals.</h2><p>If you or someone you know needs support, start with the assistance request journey. Publication is never the starting point.</p><div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/request-assistance">Request assistance</Link><Link className="v2-text-link" href="/get-involved">Other ways to help →</Link></div></div></section>
    </div>
  );
}
