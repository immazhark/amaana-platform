import Link from "next/link";
import { getPublishedInitiatives } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transparency",
  description: "See how Amaana Foundation connects published initiatives, evidence, updates and privacy-safe reporting.",
};

export default async function TransparencyPage() {
  const initiatives = await getPublishedInitiatives();

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Transparency</p>
          <h1 className="v2-display" style={{ maxWidth: "9ch" }}>See what your trust became.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Transparency should connect a published need or initiative to what was prepared, delivered and responsibly documented — without exposing private verification material.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">The evidence chain</p>
              <h2 className="v2-section-title">Support should lead to evidence.</h2>
            </div>
            <p className="v2-section-intro">Amaana&apos;s public record is being structured so visitors can move from initiative context to approved media, stories, appeal updates and documented outcomes where those records exist.</p>
          </div>

          <div className="v2-journey">
            <div className="v2-journey-step"><b>Need or initiative</b><span>What was being addressed and why.</span></div>
            <div className="v2-journey-step"><b>Support received</b><span>Public-safe contribution or campaign information where verified and appropriate.</span></div>
            <div className="v2-journey-step"><b>Preparation</b><span>Procurement, packing, coordination or other documented action.</span></div>
            <div className="v2-journey-step"><b>Delivery</b><span>Distribution, handover or assistance actually completed.</span></div>
            <div className="v2-journey-step"><b>Known outcome</b><span>Only outcomes supported by Amaana&apos;s records are stated publicly.</span></div>
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Published initiatives</p>
              <h2 className="v2-section-title">Follow evidence back to the work.</h2>
            </div>
            <p className="v2-section-intro">Each initiative page can accumulate approved media, stories, related appeals and reporting without making private source documents public.</p>
          </div>

          {initiatives.length > 0 ? (
            <div className="v2-work-grid">
              {initiatives.map(initiative => (
                <Link className="v2-work-card" href={`/our-work/${initiative.slug}`} key={initiative.id}>
                  <small>{initiative.cause.title}</small>
                  <div>
                    {initiative.primaryMetric && <span className="v2-metric">{initiative.primaryMetric}</span>}
                    {initiative.primaryMetricLabel && <p>{initiative.primaryMetricLabel}</p>}
                    <h3>{initiative.title}</h3>
                    <p>{initiative.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="v2-section-intro">There are no published initiatives to show yet.</p>
          )}
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Privacy boundary</p>
            <h2 className="v2-section-title">Transparency does not mean exposing people.</h2>
            <p className="v2-section-intro">Sensitive medical records, identity documents, bank information, private contact details and verification material remain protected even when a public-safe story or initiative record is available.</p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Publication rule</span>
            <blockquote>Public evidence. Private proofs.</blockquote>
            <p>Media and stories remain hidden until their publication and privacy gates are satisfied.</p>
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Explore the record</p>
          <h2>Context, evidence and dignity belong together.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/impact">Explore impact</Link>
            <Link className="v2-text-link" href="/stories">Stories of Amanah →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
