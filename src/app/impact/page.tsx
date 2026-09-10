import type { Metadata } from "next";
import Link from "next/link";
import { homepageImpact, initiatives } from "@/content/amaana";

export const metadata: Metadata = {
  title: "Our Impact",
  description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
};

export default function ImpactPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Impact</p>
          <h1 className="v2-display" style={{ maxWidth: "8ch" }}>Impact is not one number.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Every figure should lead back to a real initiative, a known outcome, authentic media and evidence that explains what happened.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-impact-grid">
            {homepageImpact.map(item => (
              <div className="v2-impact-item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Evidence by initiative</p>
              <h2 className="v2-section-title">Numbers with context.</h2>
            </div>
            <p className="v2-section-intro">As the canonical archive is ingested, each initiative will gain its own photographs, year-by-year records, reports, stories and evidence links rather than relying on isolated headline statistics.</p>
          </div>
          <div className="v2-work-grid">
            {initiatives.map(item => (
              <Link href={item.href} className="v2-work-card" key={item.slug}>
                <small>{item.eyebrow}</small>
                <div>
                  <span className="v2-metric">{item.metric}</span>
                  <p>{item.metricLabel}</p>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Transparency</p>
            <h2 className="v2-section-title">See what your trust became.</h2>
            <p className="v2-section-intro">The next implementation wave will connect documented contributions to procurement, preparation, delivery, known outcomes and public-safe reports.</p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Public-safe evidence</span>
            <blockquote>Contribution → action → delivery → outcome.</blockquote>
            <p>Sensitive medical records, identity documents, bank information and private verification material remain protected even when a public story is available.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
