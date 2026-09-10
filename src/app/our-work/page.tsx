import Link from "next/link";
import { initiatives } from "@/content/amaana";

export const metadata = {
  title: "Our Work",
  description: "Explore Amaana Foundation initiatives across food support, education, seasonal relief, emergency response, medical assistance and livelihoods.",
};

export default function OurWorkPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Our Work</p>
          <h1 className="v2-display" style={{ maxWidth: "8ch" }}>Service that grows with the need.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Amaana's initiatives have grown from a family-led Ramadan effort into recurring food, education, seasonal, emergency, medical and livelihood support across Hyderabad.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Initiatives</p>
              <h2 className="v2-section-title">A living portfolio of service.</h2>
            </div>
            <p className="v2-section-intro">
              This hub is designed to grow. New causes and initiatives can be added without changing the public-site structure; each can later receive its own story, gallery, impact record, reports and related appeals.
            </p>
          </div>

          <div className="v2-work-grid">
            {initiatives.map(initiative => (
              <article className="v2-work-card" id={initiative.slug} key={initiative.slug}>
                <small>{initiative.eyebrow}{initiative.years ? ` · ${initiative.years}` : ""}</small>
                <div>
                  <span className="v2-metric">{initiative.metric}</span>
                  <p>{initiative.metricLabel}</p>
                  <h3>{initiative.title}</h3>
                  <p>{initiative.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Growing responsibly</p>
          <h2>More causes can begin here.</h2>
          <p>As Amaana expands into new verified areas of service, the platform will support new causes, initiatives, stories, galleries, reports and appeals without redesigning the site.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/impact">Explore impact</Link>
            <Link className="v2-text-link" href="/get-involved">Get involved →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
