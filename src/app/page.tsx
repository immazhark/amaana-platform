import "./home-showcase.css";
import "./campaign-home.css";
import "./home-documentary.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { PageHero } from "@/components/page-hero";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { getHomepagePublicContent } from "@/lib/public-content";
import { eidGrowth, foundingStory, homepageImpact } from "@/content/amaana";
import { getOurWorkIndexData } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";
import { programmeCategories } from '@/lib/master-copy';
import { programmeCategoryPath } from '@/lib/programme-category-routing';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad" },
  description: "Amaana Foundation is a Hyderabad-based registered charitable trust supporting verified needs through Eid Gift Kits, Taleem, Qurbani, seasonal relief, emergency response and medical or financial assistance.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad",
    description: "A Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad",
    description: "A Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance.",
  },
};

export default async function HomePage() {
  const [{ appeals }, causes] = await Promise.all([getHomepagePublicContent(), getOurWorkIndexData()]);
  const featured = causes.flatMap(cause => cause.initiatives.map(item => ({ ...item, causeTitle: cause.title })));
  const fieldDrives = featured.filter(item => ["qurbani-meat-distribution-2026", "dates-distribution-2026"].includes(item.slug));
  const heroDrive = fieldDrives.find(item => item.slug === "qurbani-meat-distribution-2026");
  const heroMedia = heroDrive?.mediaAssets[0];
  const programmeMedia = new Map(
    causes.map(cause => [
      cause.slug,
      cause.initiatives.find(initiative => initiative.mediaAssets[0])?.mediaAssets[0],
    ] as const),
  );

  const heroVisual = heroDrive && heroMedia ? (
    <div className="v3-hero-media">
      <div className="v3-hero-photo"><PublicMedia asset={heroMedia} priority sizes="(max-width: 900px) calc(100vw - 2rem), 46vw" /></div>
      <div className="v3-hero-media-shade" aria-hidden="true" />
      <div className="v3-hero-media-caption"><span>{heroDrive.year}</span><strong>{heroDrive.title}</strong><Link href={`/our-work/${heroDrive.slug}`}>See the drive</Link></div>
    </div>
  ) : undefined;

  return (
    <div className="v3-home">
      <PageHero
        variant="level1"
        className="page-hero--home"
        id="amaana-home-title"
        eyebrow="Amaana Foundation · Hyderabad"
        title="Trust, Turned Into Action."
        description={<p>Amaana Foundation is a Hyderabad-based charitable trust helping families through verified medical and financial assistance, education support, Ramadan and Eid initiatives, seasonal relief and emergency response. We believe every contribution is an amaana—a trust to be handled with dignity, transparency and responsibility.</p>}
        actions={[
          { label: "Explore our work", href: "/our-work" },
          { label: "Support a Verified Need", href: "/donate", secondary: true },
        ]}
        visual={heroVisual}
        visualKicker="Amaana Foundation"
        visualTitle="Documented work"
        visualNote="Approved programme media appears here when available."
      />

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
              <h2 className="v3-heading" id="field-title">Impact We Can Stand Behind</h2>
            </div>
            <p className="v3-intro">We would rather show programme-level evidence than publish one oversized number that cannot be responsibly audited. Our impact reporting focuses on documented annual reach, quantities distributed, verified cases completed and what donor support enabled.</p>
          </div>

          <div className="v3-field-grid">
            {fieldDrives.map((drive, index) => (
              <Link className={`v3-field-card ${index === 0 ? "v3-field-card-wide" : "v3-field-card-tall"}`} href={`/our-work/${drive.slug}`} key={drive.id}>
                {drive.mediaAssets[0] ? <div className="v3-field-image"><PublicMedia asset={drive.mediaAssets[0]} sizes={index === 0 ? "(max-width: 900px) calc(100vw - 2rem), 58vw" : "(max-width: 900px) calc(100vw - 2rem), 34vw"} /></div> : <div className="v3-field-image"><WorkVisualPlaceholder label={drive.title} /></div>}
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
              <h2 className="v3-heading" id="featured-work-title">Different Needs. One Standard of Care.</h2>
            </div>
            <p className="v3-intro">Some needs return every year. Others arrive without warning. Amaana’s work therefore combines recurring programmes with verified case-led assistance—from Eid Gift Kits and Qurbani distribution to Taleem, winter relief, emergency response and urgent medical or financial support.</p>
          </div>

          <div className="v3-work-list">
            {programmeCategories.map((category, index) => {
              const media = programmeMedia.get(category.slug);
              return (
                <Link className="v3-work-row" href={programmeCategoryPath(category.slug)} key={category.slug}>
                  <div className="work-thumb">
                    {media ? (
                      <PublicMedia asset={media} sizes="(max-width: 600px) 5rem, (max-width: 900px) 5.5rem, 7rem" />
                    ) : (
                      <WorkVisualPlaceholder label={category.title} />
                    )}
                  </div>
                  <small>{String(index + 1).padStart(2, '0')} · Our Work</small>
                  <h3>{category.title}</h3>
                  <div className="v3-work-metric">
                    <span>{category.summary}</span>
                  </div>
                  <span className="v3-arrow" aria-hidden="true">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="v3-section v3-eid" aria-labelledby="eid-growth-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Seven years of Eid Gift Kits</p>
              <h2 className="v3-heading" id="eid-growth-title">From 85 families in 2020 to 710 in 2026.</h2>
            </div>
            <p className="v3-intro">A Ramadan effort that began around one family table became a recurring community tradition. The growth below follows the documented year-by-year record.</p>
          </div>

          <div className="v3-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {eidGrowth.map(item => (
              <div className="v3-year" key={item.year}>
                <strong>{item.year}</strong>
                <span>{item.families}</span>
                <small>families</small>
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
            <h2 id="trust-title">Compassion With Accountability</h2>
            <p>Good intentions matter. So does what happens next. Amaana Foundation works close to the communities it serves, reviews needs before mobilising support, protects sensitive beneficiary information, and reports documented outcomes wherever records permit. Our responsibility is not only to collect support, but to ensure that it is directed toward the purpose for which it was entrusted.</p>
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
                <h3>No Public Appeal Is Open Right Now</h3>
                <p>That does not mean the work has stopped. You can explore completed cases or ask about Amaana’s recurring initiatives. New urgent appeals will appear here after verification.</p>
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
          <h2>Upholding Trust. Serving With Compassion, Dignity and Accountability.</h2>
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
