import "./home-showcase.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { getHomepagePublicContent } from "@/lib/public-content";
import { eidGrowth, foundingStory, homepageImpact, initiatives } from "@/content/amaana";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amaana Foundation",
  description: "Faith-inspired service, dignified assistance and transparent community action from Amaana Foundation in Hyderabad.",
  alternates: { canonical: "/" },
};

const featured = initiatives.filter(item => [
  "eid-gift-kits",
  "qurbani-meat-distribution",
  "dates-distribution",
  "winter-relief",
  "taleem",
].includes(item.slug));

export default async function HomePage() {
  const { appeals } = await getHomepagePublicContent();

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

          <div className="v3-hero-media" aria-label="Amaana Foundation documented field work">
            <div className="v3-hero-photo">
              <Image
                src="/media/qurbani-meat-distribution-2026.webp"
                alt="Amaana Foundation Meat Distribution Drive 2026 labelled distribution boxes prepared for delivery"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 48vw"
              />
            </div>
            <div className="v3-hero-media-shade" aria-hidden="true" />
            <div className="v3-hero-media-caption">
              <span>Documented work · 2026</span>
              <strong>Prepared with care. Shared with dignity.</strong>
              <Link href="/our-work#qurbani-meat-distribution">Meat Distribution Drive →</Link>
            </div>
            <div className="v3-hero-seal" aria-hidden="true">
              <Image src="/brand/amaana-mark.svg" alt="" width={112} height={112} />
            </div>
          </div>
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
            <p className="v3-intro">Real preparation, real campaign material and real initiative records — shown from the correct source folders, without stretching, relabelling or decorative substitutes.</p>
          </div>

          <div className="v3-field-grid">
            <Link className="v3-field-card v3-field-card-wide" href="/our-work#qurbani-meat-distribution">
              <div className="v3-field-image">
                <Image
                  src="/media/qurbani-meat-distribution-2026.webp"
                  alt="Amaana Foundation Meat Distribution Drive 2026 labelled distribution boxes"
                  fill
                  sizes="(max-width: 760px) 100vw, 62vw"
                />
              </div>
              <div className="v3-field-copy">
                <span>Meat Distribution Drive · 2026</span>
                <h3>Preparation before distribution.</h3>
                <p>A verified initiative image from Amaana&apos;s 2026 Meat Distribution Drive archive.</p>
              </div>
            </Link>

            <Link className="v3-field-card v3-field-card-tall" href="/our-work#dates-distribution">
              <div className="v3-field-image">
                <Image
                  src="/media/dates-distribution-2026.webp"
                  alt="Amaana Foundation Dates Distribution Drive 2026 packages"
                  fill
                  sizes="(max-width: 760px) 100vw, 38vw"
                />
              </div>
              <div className="v3-field-copy">
                <span>Ramadan · 2026</span>
                <h3>162 kg of dates distributed.</h3>
                <p>Documented Ramadan giving, sourced from the Dates Distribution 2026 archive.</p>
              </div>
            </Link>
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
            <p className="v3-intro">A focused view of Amaana&apos;s recurring and documented initiatives. Each programme is being rebuilt around verified records, source-linked figures and correctly mapped media.</p>
          </div>

          <div className="v3-work-list">
            {featured.map((initiative, index) => (
              <Link className="v3-work-row" href={initiative.href} key={initiative.slug}>
                <small>{String(index + 1).padStart(2, "0")} · {initiative.eyebrow}</small>
                <h3>{initiative.title}</h3>
                <div className="v3-work-metric">
                  <strong>{initiative.metric}</strong>
                  <span>{initiative.metricLabel}</span>
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
