import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedInitiatives } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Impact",
  description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
};

export default async function ImpactPage() {
  const initiatives = await getPublishedInitiatives();
  const initiativesWithMetrics = initiatives.filter(item => item.primaryMetric && item.primaryMetricLabel);

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
          {initiativesWithMetrics.length > 0 ? (
            <div className="v2-impact-grid">
              {initiativesWithMetrics.map(item => (
                <div className="v2-impact-item" key={item.id}>
                  <strong>{item.primaryMetric}</strong>
                  <span>{item.primaryMetricLabel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8" }}>
              <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>Evidence gate active</span>
              <h3 style={{ marginTop: "1rem" }}>No public impact figures are available yet.</h3>
              <p style={{ color: "#68717a" }}>Metrics appear here only after the associated initiative is published.</p>
            </div>
          )}
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Evidence by initiative</p>
              <h2 className="v2-section-title">Numbers with context.</h2>
            </div>
            <p className="v2-section-intro">Each published initiative can carry its own approved photographs, year-by-year records, stories, reports and related appeals. Private verification material stays private.</p>
          </div>
          {initiatives.length > 0 ? (
            <div className="v2-work-grid">
              {initiatives.map(item => (
                <Link href={`/our-work/${item.slug}`} className="v2-work-card" key={item.id}>
                  <small>{item.cause.title}</small>
                  <div>
                    {item.primaryMetric && <span className="v2-metric">{item.primaryMetric}</span>}
                    {item.primaryMetricLabel && <p>{item.primaryMetricLabel}</p>}
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="v2-section-intro">There are no published initiatives to display.</p>
          )}
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Transparency</p>
            <h2 className="v2-section-title">See what your trust became.</h2>
            <p className="v2-section-intro">Public evidence should connect support to preparation, delivery and known outcomes without exposing medical records, identity documents, bank details or private verification material.</p>
            <Link className="v2-text-link" href="/transparency">Explore transparency →</Link>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Public-safe evidence</span>
            <blockquote>Contribution → action → delivery → outcome.</blockquote>
            <p>Only approved, public-safe evidence belongs on the public site.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
