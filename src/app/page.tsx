import { SectionHeading } from "@/components/section-heading";
import { BodyCarousel } from "@/components/body-carousel";
import "./home-showcase.css";
import "./home-documentary.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { formatINR, getRemainingAppealAmount } from "@/lib/appeals";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { getHomepageAppeals } from "@/lib/public-content";
import { HomeGrowth, HomeTrust } from "@/components/home-evidence";
import { getHomepageDiscoveryData } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { programmeCategories, programmes } from '@/lib/master-copy';
import { HomeStorySlide } from "@/components/home-story-slide";
import { HomeHighlights } from "@/components/home-highlights";
import { programmeCategoryPath } from '@/lib/programme-category-routing';
import { selectIdentityPublicImage } from '@/lib/public-media';
import { openGraphShareImages, twitterShareImages } from '@/lib/social-share-media';
import { canonicalOurWorkDestination, isLegacyOurWorkSlug } from '@/lib/our-work-routing';

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
    images: openGraphShareImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad",
    description: "A Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance.",
    images: twitterShareImages(),
  },
};

export default async function HomePage() {
  const [appeals, discovery] = await Promise.all([getHomepageAppeals(), getHomepageDiscoveryData()]);
  const featured = discovery.initiatives
    .filter(item => !isLegacyOurWorkSlug(item.slug))
    .map(item => ({ ...item, causeTitle: item.cause.title }));
  const hasOpenAppeals = appeals.length > 0;
  const heroSlides = featured
    .filter(item => item.isFeatured)
    .map(drive => ({ drive, media: selectIdentityPublicImage(drive.mediaAssets) }))
    .filter((item): item is typeof item & { media: NonNullable<typeof item.media> } => Boolean(item.media))
    .slice(0, 5);
  const publicProgrammeSlugs = new Set(discovery.publishedProgrammeSlugs);
  const eidProgrammePublished = publicProgrammeSlugs.has("eid-gift-kits");
  const visibleProgrammeCategories = programmeCategories.filter(category => {
    const destination = programmeCategoryPath(category.slug);
    if (destination.startsWith("/our-work/")) {
      const destinationSlug = destination.slice("/our-work/".length);
      return Boolean(destinationSlug) && publicProgrammeSlugs.has(destinationSlug);
    }

    return programmes.some(programme =>
      programme.causeSlug === category.slug
      && !("parentSlug" in programme)
      && publicProgrammeSlugs.has(programme.slug),
    );
  });
  const programmeMedia = new Map(
    discovery.causes.map(cause => [
      cause.slug,
      cause.initiatives.map(initiative => selectIdentityPublicImage(initiative.mediaAssets)).find(Boolean),
    ] as const),
  );



  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="amaana-home-title">
        <div className="amaana-backdrop-emblem" aria-hidden="true" />
        <h1
          id="amaana-home-title"
          style={{
            position: "absolute",
            inlineSize: 1,
            blockSize: 1,
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
          Amaana Foundation — Trust, Turned Into Action.
        </h1>
        <ScrollCarousel label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          <HomeStorySlide />
          {appeals.slice(0, 1).map(appeal => (
            <article className="v3-home-banner-slide v3-home-banner-slide--appeal" key={`appeal-${appeal.slug}`}>
              <div className="v3-home-banner-shade" aria-hidden="true" />
              <div className="v3-shell v3-home-banner-content">
                <p className="v3-home-banner-kicker">Current verified appeal</p>
                <span className="v3-home-banner-brandline">{appeal.title}</span>
                <p>{appeal.summary}</p>
                <div className="v3-home-banner-metric"><strong>{formatINR(getRemainingAppealAmount(appeal.amountRaised, appeal.goalAmount))}</strong><span>remaining verified need</span></div>
                <div className="v3-home-banner-actions">
                  <Link className="v3-btn" href={`/appeals/${appeal.slug}`}>View this appeal</Link>
                  <Link className="v3-btn secondary" href={`/donate/${appeal.slug}`}>Support this need</Link>
                </div>
              </div>
            </article>
          ))}
          {heroSlides.map(({ drive, media }) => (
            <article className="v3-home-banner-slide" key={drive.id}>
              <div className="v3-home-banner-media"><PublicMedia asset={media} sizes="100vw" /></div>
              <div className="v3-home-banner-shade" aria-hidden="true" />
              <div className="v3-shell v3-home-banner-content">
                <p className="v3-home-banner-kicker">Amaana Foundation · {drive.causeTitle}</p>
                <span className="v3-home-banner-brandline">{drive.title}</span>
                <p>{drive.summary}</p>
                {drive.primaryMetric ? <div className="v3-home-banner-metric"><strong>{drive.primaryMetric}</strong><span>{drive.primaryMetricLabel ?? "Documented impact"}</span></div> : null}
                <div className="v3-home-banner-actions">
                  <Link className="v3-btn" href={canonicalOurWorkDestination(drive.slug)}>Explore this initiative</Link>
                  <Link className="v3-btn secondary" href={hasOpenAppeals ? "/appeals" : "/get-involved"}>{hasOpenAppeals ? "Support a verified need" : "Ways to support"}</Link>
                </div>
              </div>
            </article>
          ))}
        </ScrollCarousel>
      </section>

      <HomeHighlights />

      {visibleProgrammeCategories.length > 0 && (
        <section className="v3-section v3-work" aria-labelledby="featured-work-title">
          <div className="v3-shell">
            <p className="v3-label">How Amaana serves</p>
            <p className="v3-intro">Some needs return every year. Others arrive without warning. Amaana’s work therefore combines recurring programmes with verified case-led assistance—from Eid Gift Kits and Qurbani distribution to Taleem, winter relief, emergency response and urgent medical or financial support.</p>
            <BodyCarousel label="Amaana programme areas" variant="home-showcase" className="v3-work-carousel" autoAdvanceMs={6500} heading={<h2 className="v3-heading" id="featured-work-title">Different Needs. One Standard of Care.</h2>}>
              {visibleProgrammeCategories.map((category, index) => {
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
            </BodyCarousel>
          </div>
        </section>
      )}

      <HomeGrowth eidProgrammePublished={eidProgrammePublished} />
      <HomeTrust hasOpenAppeals={hasOpenAppeals} />

      <section className="v3-section v3-appeals" aria-labelledby="appeals-title">
        <div className="v3-shell">
          <SectionHeading eyebrow={<>Current verified appeals</>} title={<>When there is a need, we share it responsibly.</>} subtitle={<>Active public appeals appear here after review. Completed work remains available even when there is no current fundraising appeal.</>} id="appeals-title" className="v3-section-head" titleClassName="v3-heading" />

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

    </div>
  );
}
