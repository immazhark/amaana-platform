import type { Metadata } from "next";
import Link from "next/link";
import { PublicMedia } from "@/components/public-media";
import { getImpactPageData } from "@/lib/public-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Impact",
  description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
  alternates: { canonical: "/impact" },
  openGraph: {
    type: "website",
    url: "/impact",
    title: "Our Impact | Amaana Foundation",
    description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
  },
};

export default async function ImpactPage() {
  const initiatives = await getImpactPageData();
  const initiativesWithMetrics = initiatives.filter(item => item.primaryMetric && item.primaryMetricLabel);
  const initiativesWithMedia = initiatives.filter(item => item.mediaAssets.length > 0);

  return (
    <div className="v2-home v2-impact-page">
      <section className="v2-impact-hero">
        <div className="v2-shell v2-impact-hero-grid">
          <div className="v2-impact-hero-copy">
            <p className="v2-section-label">Impact · evidence · continuity</p>
            <h1>Impact is not<br />one number.</h1>
            <p>It is a chain: a need understood, support entrusted, work carried out, and a known outcome documented with enough context to mean something.</p>
            <div className="v2-hero-actions"><a className="v2-button" href="#evidence">Follow the evidence</a><Link className="v2-text-link" href="/transparency">How we report →</Link></div>
          </div>
          <div className="v2-impact-hero-orbit" aria-hidden="true"><span>Need</span><span>Trust</span><strong>Amanah</strong><span>Action</span><span>Outcome</span></div>
        </div>
      </section>

      <section className="v2-impact-marquee" aria-label="Published impact figures">
        {initiativesWithMetrics.length > 0 ? <div className="v2-impact-marquee-track">{initiativesWithMetrics.map((item, index) => <div className="v2-impact-marquee-item" key={item.id}><small>{String(index + 1).padStart(2, "0")} · {item.cause.title}</small><strong>{item.primaryMetric}</strong><span>{item.primaryMetricLabel}</span></div>)}</div> : <div className="v2-shell"><p>Impact figures appear only when their initiatives are published.</p></div>}
      </section>

      <section className="v2-section paper" id="evidence">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Evidence by initiative</p><h2 className="v2-section-title">Every number has a home.</h2></div><p className="v2-section-intro">Rather than collapse unlike forms of help into one oversized total, Amaana keeps public figures connected to the initiative that produced them.</p></div>
          {initiatives.length > 0 ? <div className="v2-impact-ledger">{initiatives.map((item, index) => <Link href={`/our-work/${item.slug}`} className="v2-impact-ledger-row" key={item.id}><span className="v2-impact-ledger-index">{String(index + 1).padStart(2, "0")}</span><div><small>{item.cause.title}</small><h3>{item.title}</h3></div><p>{item.summary}</p><div className="v2-impact-ledger-metric">{item.primaryMetric ? <><strong>{item.primaryMetric}</strong><span>{item.primaryMetricLabel}</span></> : <><strong>View</strong><span>documented initiative</span></>}</div><span className="v2-impact-ledger-arrow" aria-hidden="true">↗</span></Link>)}</div> : <div className="v2-reminder v2-light-reminder"><span className="v2-reminder-label">Evidence gate active</span><h3>No published initiative evidence yet.</h3><p>Nothing is invented to fill the space.</p></div>}
        </div>
      </section>

      {initiativesWithMedia.length > 0 && <section className="v2-section dark v2-impact-witness"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Witness the work</p><h2 className="v2-section-title">Evidence can be seen, not just counted.</h2></div><p className="v2-section-intro">Only privacy-approved, public-safe material is shown. The people Amaana serves are never treated as proof objects.</p></div><div className="v2-impact-witness-grid">{initiativesWithMedia.slice(0, 4).map((item, index) => <Link href={`/our-work/${item.slug}`} className={`v2-impact-witness-item ${index === 0 ? "lead" : ""}`} key={item.id}><PublicMedia asset={item.mediaAssets[0]} /><div><small>{item.cause.title}</small><h3>{item.title}</h3><span>Enter the field record →</span></div></Link>)}</div></div></section>}

      <section className="v2-section v2-impact-philosophy">
        <div className="v2-shell v2-impact-philosophy-grid">
          <div><p className="v2-section-label">What counts as impact?</p><h2 className="v2-section-title">The outcome matters.<br />So does the way it was reached.</h2></div>
          <div className="v2-impact-principles"><article><span>01</span><h3>Specificity</h3><p>Year, initiative and known outcome stay attached to the figure.</p></article><article><span>02</span><h3>Dignity</h3><p>Private proofs remain private even when the public outcome is documented.</p></article><article><span>03</span><h3>Continuity</h3><p>Completed work remains part of Amaana&apos;s public record instead of disappearing after a campaign.</p></article><article><span>04</span><h3>Restraint</h3><p>Missing information stays missing until it can be responsibly supported.</p></article></div>
        </div>
      </section>

      <section className="v2-section dark v2-impact-trust"><div className="v2-shell v2-faith-grid"><div><p className="v2-section-label">Transparency</p><h2 className="v2-section-title">Follow trust from support to outcome.</h2><p className="v2-section-intro">The public evidence trail is designed to explain what happened without publishing identity documents, medical records, bank details or private verification material.</p><Link className="v2-button" href="/transparency">Explore transparency</Link></div><div className="v2-reminder"><span className="v2-reminder-label">The evidence chain</span><blockquote>Need → trust → preparation → delivery → known outcome.</blockquote><p>Public evidence. Private proofs.</p></div></div></section>
    </div>
  );
}
