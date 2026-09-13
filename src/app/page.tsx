import "./home-showcase.css";
import "./campaign-home.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { getHomepagePublicContent } from "@/lib/public-content";
import { eidGrowth, foundingStory, homepageImpact } from "@/content/amaana";
import { getOurWorkIndexData } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amaana Foundation",
  description: "Faith-inspired service, dignified assistance and transparent community action from Amaana Foundation in Hyderabad.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ appeals }, causes] = await Promise.all([getHomepagePublicContent(), getOurWorkIndexData()]);
  const featured = causes.flatMap(cause => cause.initiatives.map(item => ({ ...item, causeTitle: cause.title })));
  const fieldDrives = featured.filter(item => ["qurbani-meat-distribution-2026", "dates-distribution-2026"].includes(item.slug));
  const heroDrive = fieldDrives.find(item => item.slug === "qurbani-meat-distribution-2026");
  const heroMedia = heroDrive?.mediaAssets[0];

  return (
    <div className="v3-home">
      <section className="v3-hero" aria-labelledby="amaana-home-title">
        <div className="v3-shell v3-hero-grid">
          <div className="v3-hero-copy">
            <p className="v3-kicker">Amaana Foundation · Hyderabad</p>
            <h1 className="v3-title" id="amaana-home-title">Faith. Dignity. Action.</h1>
            <p className="v3-lead">
              What began with 85 families during Ramadan 2020 has grown into a community-supported journey of service — carrying care with dignity, transparency and trust.
            </p>
            <div className="v3-actions">
              <Link className="v3-btn" href="/our-work">Explore our work</Link>
              <Link className="v3-btn secondary" href="/about">Our story</Link>
            </div>
          </div>

          {heroDrive && heroMedia && <div className="v3-hero-media" aria-label={heroDrive.title}>
            <div className="v3-hero-photo"><PublicMedia asset={heroMedia} priority /></div>
            <div className="v3-hero-media-shade" aria-hidden="true" />
            <div className="v3-hero-media-caption"><span>{heroDrive.year}</span><strong>{heroDrive.title}</strong><Link href={`/our-work/${heroDrive.slug}`}>See the drive</Link></div>
          </div>}
        </div>
      </section>

      <section className="v3-proof" aria-label="Selected documented impact">
        <div className="v3-shell v3-proof-grid">
          {homepageImpact.map(item => (
            <div className="v3-proof-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v3-section v3-field" aria-labelledby="field-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Seen in the work</p>
              <h2 className="v3-heading" id="field-title">Amanah should be visible.</h2>
            </div>
            <p className="v3-intro">See the preparation, photographs and campaign updates behind Amaana’s recent drives.</p>
          </div>

          <div className="v3-field-grid">
            {fieldDrives.map((drive, index) => (
              <Link className={`v3-field-card ${index === 0 ? "v3-field-card-wide" : "v3-field-card-tall"}`} href={`/our-work/${drive.slug}`} key={drive.id}>
                {drive.mediaAssets[0] && <div className="v3-field-image"><PublicMedia asset={drive.mediaAssets[0]} /></div>}
                <div className="v3-field-copy"><span>{drive.year}</span><h3>{drive.title}</h3><p>{drive.summary}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v3-section v3-work" aria-labelledby="featured-work-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Documented work</p>
              <h2 className="v3-heading" id="featured-work-title">Different needs. One amanah to serve.</h2>
            </div>
            <p className="v3-intro">Food support, education, emergency relief and individual assistance. Explore the work and the people it serves.</p>
          </div>

          <div className="v3-work-list">
            {featured.map((initiative) => (
              <Link className="v3-work-row" href={`/our-work/${initiative.slug}`} key={initiative.slug}>
                <small>{initiative.causeTitle}{initiative.year ? ` · ${initiative.year}` : ""}</small>
                <h3>{initiative.title}</h3>
                <div className="v3-work-metric">
                  <strong>{initiative.primaryMetric}</strong>
                  <span>{initiative.primaryMetricLabel}</span>
                </div>
                <span className="v3-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v3-section v3-eid" aria-labelledby="eid-growth-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Seven years of Eid Gift Kits</p>
              <h2 className="v3-heading" id="eid-growth-title">From 85 families to 710 Eid Gift Kits.</h2>
            </div>
            <p className="v3-intro">A Ramadan effort that began around one family table became a recurring community tradition. The growth below follows the documented year-by-year record.</p>
          </div>

          <div className="v3-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {eidGrowth.map(item => (
              <div className="v3-year" key={item.year}>
                <strong>{item.year}</strong>
                <span>{item.families}</span>
                <small>{item.year === "2026" ? "kits" : "families"}</small>
              </div>
            ))}
          </div>

          <div className="v3-actions">
            <Link className="v3-btn" href="/our-work/eid-gift-kits">Explore the seven-year story</Link>
          </div>
        </div>
      </section>

      <section className="v3-section v3-origin" aria-labelledby="origin-title">
        <div className="v3-shell v3-origin-grid">
          <div className="v3-origin-mark" aria-hidden="true">85</div>
          <div className="v3-origin-copy">
            <p className="v3-label">{foundingStory.eyebrow}</p>
            <h2 id="origin-title">{foundingStory.headline}</h2>
            <p>{foundingStory.body}</p>
            <Link className="v3-btn" href="/about">Read Amaana&apos;s story</Link>
          </div>
        </div>
      </section>

      <section className="v3-section v3-trust" aria-labelledby="trust-title">
        <div className="v3-shell v3-trust-grid">
          <div className="v3-trust-panel">
            <p className="v3-label">Trust is part of the work</p>
            <h2 id="trust-title">Public evidence. Private proofs.</h2>
            <p>We share what can responsibly be made public while protecting beneficiary documents, personal circumstances and sensitive supporting information.</p>
            <div className="v3-actions">
              <Link className="v3-btn" href="/transparency">Explore transparency</Link>
              <Link className="v3-btn secondary" href="/how-we-verify">How Amaana works</Link>
            </div>
          </div>

          <div>
            <p className="v3-label">Take the next step</p>
            <div className="v3-quick-links">
              <Link href="/our-work"><span>Explore our work</span><span aria-hidden="true">↗</span></Link>
              <Link href="/appeals"><span>Support a verified need</span><span aria-hidden="true">↗</span></Link>
              <Link href="/request-assistance"><span>Request assistance privately</span><span aria-hidden="true">↗</span></Link>
              <Link href="/get-involved"><span>Volunteer time or skills</span><span aria-hidden="true">↗</span></Link>
              <Link href="/contact"><span>Contact Amaana</span><span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="v3-section v3-appeals" aria-labelledby="appeals-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Current verified appeals</p>
              <h2 className="v3-heading" id="appeals-title">When there is a need, we share it responsibly.</h2>
            </div>
            <p className="v3-intro">Active public appeals appear here after review. Completed work remains available even when there is no current fundraising appeal.</p>
          </div>

          {appeals.length ? (
            <div className="grid appeal-grid">
              {appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}
            </div>
          ) : (
            <div className="v3-empty">
              <div>
                <h3>No active public appeal right now.</h3>
                <p>Explore completed initiatives, documented impact and Amaana&apos;s continuing work.</p>
              </div>
              <div className="v3-actions">
                <Link className="v3-btn" href="/our-work">Explore our work</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v3-closing">
        <div className="v3-shell">
          <p className="v3-label">Amaana Foundation</p>
          <h2>From our hearts to their homes.</h2>
          <p>Follow the work, understand the evidence and take the next step with confidence.</p>
          <div className="v3-actions">
            <Link className="v3-btn" href="/our-work">See the work</Link>
            <Link className="v3-btn secondary" href="/get-involved">Get involved</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
