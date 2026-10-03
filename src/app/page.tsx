import { SectionHeading } from "@/components/section-heading";
import { BodyCarousel } from "@/components/body-carousel";
import "./home-showcase.css";
import "./home-documentary.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { getHomepageAppeals } from "@/lib/public-content";
import { HomeGrowth, HomeTrust } from "@/components/home-evidence";
import { getHomepageDiscoveryData, getAppealCoverMedia } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { programmeCategories, programmes } from '@/lib/master-copy';
import { ConfiguredHomeSlide } from "@/components/home-story-slide";
import { getHomeCarouselConfig, getHomeCarouselImages } from "@/lib/home-carousel-data";
import { composeHomeSlides, defaultHomeSlides } from "@/lib/home-carousel";
import { HomeHighlights } from "@/components/home-highlights";
import { programmeCategoryPath } from '@/lib/programme-category-routing';
import { selectIdentityPublicImage } from '@/lib/public-media';
import { openGraphShareImages, twitterShareImages } from '@/lib/social-share-media';

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
  const [liveAppeals, discovery, { config }] = await Promise.all([getHomepageAppeals(20), getHomepageDiscoveryData(), getHomeCarouselConfig()]);
  const appeals = liveAppeals.slice(0, 3);
  const [images, appealImages] = await Promise.all([getHomeCarouselImages(config.slides.map(s => s.image)), Promise.all(liveAppeals.map(a => getAppealCoverMedia(a.coverImageUrl)))]);
  const appealSlides = liveAppeals.map((appeal, index) => ({ ...defaultHomeSlides[0], id: `appeal-${appeal.slug}`, eyebrow: 'Current verified appeal', title: appeal.title, description: appeal.summary, primaryLabel: 'View this appeal', primaryHref: `/appeals/${appeal.slug}`, secondaryLabel: 'Support this need', secondaryHref: `/donate/${appeal.slug}`, appealSlug: appeal.slug, image: appealImages[index] ? `asset:${appealImages[index]!.id}` : 'logo', imageAlt: appealImages[index]?.altText || '', order: index }));
  appealImages.forEach(asset => { if (asset) images.set(asset.id, asset); });
  const heroSlides = composeHomeSlides(config, appealSlides);
  const hasOpenAppeals = liveAppeals.length > 0;
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
        <ScrollCarousel cinematic label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          {heroSlides.map((slide, index) => <ConfiguredHomeSlide key={slide.id} slide={slide} asset={images.get(slide.image.slice(6))} priority={index === 0} />)}
        </ScrollCarousel>
      </section>

      <HomeHighlights />

      {visibleProgrammeCategories.length > 0 && (
        <section className="v3-section v3-work" aria-labelledby="featured-work-title">
          <div className="v3-shell">
            <SectionHeading eyebrow="How Amaana serves" title="Different Needs. One Standard of Care." subtitle="Some needs return every year. Others arrive without warning. Amaana’s work therefore combines recurring programmes with verified case-led assistance—from Eid Gift Kits and Qurbani distribution to Taleem, winter relief, emergency response and urgent medical or financial support." id="featured-work-title" />
            <BodyCarousel label="Amaana programme areas" variant="home-showcase" className="v3-work-carousel" autoAdvanceMs={6500}>
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
