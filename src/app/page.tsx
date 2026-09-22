import "./home-showcase.css";
import "./home-documentary.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { getHomepageAppeals } from "@/lib/public-content";
import { eidGrowth, homepageImpact } from "@/content/amaana";
import { getHomepageDiscoveryData } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { programmeCategories } from '@/lib/master-copy';
import { programmeCategoryPath } from '@/lib/programme-category-routing';
import { selectIdentityPublicImage } from '@/lib/public-media';

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
  const [appeals, discovery] = await Promise.all([getHomepageAppeals(), getHomepageDiscoveryData()]);
  const featured = discovery.initiatives.map(item => ({ ...item, causeTitle: item.cause.title }));
  const fieldDrives = featured.filter(item => ["qurbani-meat-distribution-2026", "dates-distribution-2026"].includes(item.slug));
  const hasOpenAppeals = appeals.length > 0;
  const heroSlides = featured
    .filter(item => item.isFeatured)
    .map(drive => ({ drive, media: selectIdentityPublicImage(drive.mediaAssets) }))
    .filter((item): item is typeof item & { media: NonNullable<typeof item.media> } => Boolean(item.media))
    .slice(0, 5);
  const programmeMedia = new Map(
    discovery.causes.map(cause => [
      cause.slug,
      cause.initiatives.map(initiative => selectIdentityPublicImage(initiative.mediaAssets)).find(Boolean),
    ] as const),
  );



  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="amaana-home-title">
        <h1 className="sr-only" id="amaana-home-title">Amaana Foundation — Trust, Turned Into Action.</h1>
        <ScrollCarousel label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          <article className="v3-home-banner-slide v3-home-banner-slide--story">
            <div className="v3-home-banner-story-art" aria-hidden="true">
              <span className="v3-home-banner-story-year">2020</span>
              <span className="v3-home-banner-story-mark">اَمَانَة</span>
            </div>
            <div className="v3-home-banner-shade" aria-hidden="true" />
            <div className="v3-shell v3-home-banner-content">
              <p className="v3-home-banner-kicker">The Story of Amaana · Hyderabad</p>
              <span className="v3-home-banner-brandline">A trust that began around one family table.</span>
              <h2>From a Ramadan effort in 2020 to Amaana Foundation today.</h2>
              <p>What began as a small grassroots effort to support families with dignity grew, year by year, into recurring community programmes and a formally organised charitable foundation. The purpose has remained the same: treat every contribution as an amaana — a trust.</p>
              <div className="v3-home-banner-actions">
                <Link className="v3-btn" href="/about">Discover our story</Link>
                <Link className="v3-btn secondary" href="/our-work">Explore our work</Link>
              </div>
            </div>
          </article>
          {heroSlides.map(({ drive, media }, index) => (
            <article className="v3-home-banner-slide" key={drive.id}>
              <div className="v3-home-banner-media"><PublicMedia asset={media} priority={index === 0} sizes="100vw" /></div>
              <div className="v3-home-banner-shade" aria-hidden="true" />
              <div className="v3-shell v3-home-banner-content">
                <p className="v3-home-banner-kicker">Amaana Foundation · {drive.causeTitle}</p>
                <span className="v3-home-banner-brandline">{drive.title}</span>
                <p>{drive.summary}</p>
                {drive.primaryMetric ? <div className="v3-home-banner-metric"><strong>{drive.primaryMetric}</strong><span>{drive.primaryMetricLabel ?? "Documented impact"}</span></div> : null}
                <div className="v3-home-banner-actions">
                  <Link className="v3-btn" href={`/our-work/${drive.slug}`}>Explore this initiative</Link>
                  <Link className="v3-btn secondary" href={hasOpenAppeals ? "/appeals" : "/get-involved"}>{hasOpenAppeals ? "Support a verified need" : "Ways to support"}</Link>
                </div>
              </div>
            </article>
          ))}
        </ScrollCarousel>
      </section>

      <section className="v3-proof" aria-labelledby="homepage-highlights-title">
        <div className="v3-shell"><p className="v3-proof-label" id="homepage-highlights-title">Highlights</p><div className="v3-proof-grid">
          {homepageImpact.map(item => (
            <div className="v3-proof-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div></div>
      </section>

      <section className="v3-section v3-field" aria-labelledby="field-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">From the field</p>
              <h2 className="v3-heading" id="field-title">A closer look at the work</h2>
            </div>
            <p className="v3-intro">Step inside selected Amaana initiatives through documented moments from the field, then open each programme to see its story and reported outcomes.</p>
          </div>

          <ScrollCarousel label="Selected documented field work" mode="cards" className="v3-field-carousel">
            {fieldDrives.map((drive, index) => {
              const media = selectIdentityPublicImage(drive.mediaAssets);
              return (
                <Link className={`v3-field-card ${index === 0 ? "v3-field-card-wide" : "v3-field-card-tall"}`} href={`/our-work/${drive.slug}`} key={drive.id}>
                  {media ? <div className="v3-field-image"><PublicMedia asset={media} sizes="(max-width: 900px) 86vw, 38vw" /></div> : <div className="v3-field-image"><WorkVisualPlaceholder label={drive.title} /></div>}
                  <div className="v3-field-copy"><span>{drive.year}</span><h3>{drive.title}</h3><p>{drive.summary}</p></div>
                </Link>
              );
            })}
          </ScrollCarousel>
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

          <ScrollCarousel label="Amaana programme areas" mode="focus" className="v3-work-carousel" autoAdvanceMs={6500}>
            {programmeCategories.map((category, index) => {
              const media = programmeMedia.get(category.slug);
              return (
                <Link className="v3-work-card" href={programmeCategoryPath(category.slug)} key={category.slug}>
                  <div className="v3-work-card-media">
                    {media ? (
                      <PublicMedia asset={media} sizes="(max-width: 700px) 86vw, 30rem" />
                    ) : (
                      <WorkVisualPlaceholder label={category.title} />
                    )}
                  </div>
                  <div className="v3-work-card-body">
                    <small>{String(index + 1).padStart(2, '0')} · Our Work</small>
                    <h3>{category.title}</h3>
                    <p>{category.summary}</p>
                    <span>Explore programme <i aria-hidden="true">↗</i></span>
                  </div>
                </Link>
              );
            })}
          </ScrollCarousel>
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
