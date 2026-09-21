import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { programmeBySlug } from "@/lib/master-copy";
import { getImpactPageData } from "@/lib/public-page-data";
import { selectIdentityPublicImage } from "@/lib/public-media";
import "./impact-refinement.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Impact",
  description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
  alternates: { canonical: "/impact" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
    type: "website",
    url: "/impact",
    title: "Our Impact | Amaana Foundation",
    description: "Explore Amaana Foundation's documented initiative outcomes, stories and evidence.",
  },
  twitter: { images: ["/twitter-image"],
    card: "summary_large_image",
    title: "Our Impact | Amaana Foundation",
    description: "Documented outcomes, initiative-level evidence and privacy-safe field records from Amaana Foundation.",
  },
};

export default async function ImpactPage() {
  const rawInitiatives = await getImpactPageData();
  const initiatives = rawInitiatives.filter(item => {
    const canonical = programmeBySlug(item.slug);
    return Boolean(canonical) && !(canonical && "parentSlug" in canonical && canonical.parentSlug);
  });
  const initiativesWithMedia = initiatives.filter(item => item.mediaAssets.length > 0);
  const heroSource = initiativesWithMedia.find(item => selectIdentityPublicImage(item.mediaAssets)) ?? initiativesWithMedia[0];
  const heroMedia = heroSource ? selectIdentityPublicImage(heroSource.mediaAssets) ?? null : null;

  return (
    <div className="v2-home v2-impact-page">
      <PageHero
        variant="level1"
        eyebrow="Impact · Evidence · Continuity"
        title="Impact, Without Inflated Numbers"
        description={<p>Every number should answer a second question: what does it represent? Amaana reports programme-level and case-level outcomes rather than collapsing unrelated activities into one marketing total.</p>}
        actions={[
          { label: "Follow the evidence", href: "#evidence" },
          { label: "How we report", href: "/transparency", secondary: true },
        ]}
        visual={heroMedia ? <PublicMedia asset={heroMedia} /> : (
          <div className="page-hero__visual-fallback page-hero__visual-fallback--impact">
            <span>Evidence chain</span>
            <strong>Need → Trust → Action → Outcome</strong>
            <small>Every published figure stays attached to the initiative, year and known result that gives it meaning.</small>
            <i />
          </div>
        )}
      />

      <section className="v2-section paper v2-impact-wall-section" id="evidence" aria-labelledby="impact-wall-title">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Wall of impact</p><h2 className="v2-section-title" id="impact-wall-title">Every tile carries a documented outcome.</h2></div><p className="v2-section-intro">Explore an outcome, then open the initiative to understand the work behind it.</p></div>
          {initiatives.length > 0 ? <div className="v2-impact-wall">{initiatives.map((item, index) => {
            const thumbnail = selectIdentityPublicImage(item.mediaAssets) ?? null;
            return <Link href={`/our-work/${item.slug}`} className={`v2-impact-tile ${thumbnail ? "has-media" : ""}`} key={item.id} aria-label={`Open ${item.title}`}>
              {thumbnail ? <div className="v2-impact-tile-media" aria-hidden="true"><PublicMedia asset={thumbnail} /></div> : null}
              <div className="v2-impact-tile-shade" aria-hidden="true" />
              <span className="v2-impact-tile-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="v2-impact-tile-copy"><small>{item.cause.title}</small>{item.primaryMetric ? <strong>{item.primaryMetric}</strong> : null}<span>{item.primaryMetricLabel ?? item.title}</span><h3>{item.title}</h3></div>
              <span className="v2-impact-tile-action" aria-hidden="true">Explore impact ↗</span>
            </Link>;
          })}</div> : <div className="v2-reminder v2-light-reminder"><span className="v2-reminder-label">Impact updates</span><h3>No initiative outcomes are published here yet.</h3><p>Outcomes will appear here when they are ready to share.</p></div>}
        </div>
      </section>

      {initiativesWithMedia.length > 0 && <section className="v2-section dark v2-impact-witness" aria-labelledby="witness-title"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Witness the work</p><h2 className="v2-section-title" id="witness-title">Evidence can be seen, not just counted.</h2></div><p className="v2-section-intro">Only photographs suitable for public sharing appear here. Personal documents and sensitive verification material remain private.</p></div><ScrollCarousel label="Documented impact photographs" mode="cards" className="v2-impact-witness-carousel">{initiativesWithMedia.slice(0, 6).map(item => { const media=selectIdentityPublicImage(item.mediaAssets); if(!media) return null; return <Link href={`/our-work/${item.slug}`} className="v2-impact-witness-item" key={item.id} aria-label={`Open ${item.title}`}><PublicMedia asset={media} /><div><small>{item.cause.title}</small><h3>{item.title}</h3><span>Explore this work →</span></div></Link>; })}</ScrollCarousel></div></section>}

      <section className="v2-section v2-impact-philosophy">
        <div className="v2-shell v2-impact-philosophy-grid">
          <div><p className="v2-section-label">What counts as impact?</p><h2 className="v2-section-title">The outcome matters.<br />So does the way it was reached.</h2></div>
          <div className="v2-impact-principles"><article><span>01</span><h3>Specificity</h3><p>Year, initiative and known outcome stay attached to the figure.</p></article><article><span>02</span><h3>Dignity</h3><p>Private proofs remain private even when the public outcome is documented.</p></article><article><span>03</span><h3>Continuity</h3><p>Completed work remains visible so its outcome can still be understood after a campaign ends.</p></article><article><span>04</span><h3>Restraint</h3><p>Missing information stays missing until it can be responsibly supported.</p></article></div>
        </div>
      </section>

      <section className="v2-section dark v2-impact-trust"><div className="v2-shell v2-faith-grid"><div><p className="v2-section-label">Transparency</p><h2 className="v2-section-title">Follow trust from support to outcome.</h2><p className="v2-section-intro">The public evidence trail is designed to explain what happened without publishing identity documents, medical records, bank details or private verification material.</p><Link className="v2-button" href="/transparency">Explore transparency</Link></div><div className="v2-reminder"><span className="v2-reminder-label">The evidence chain</span><blockquote>Need → trust → preparation → delivery → known outcome.</blockquote><p>Public evidence. Private proofs.</p></div></div></section>
    </div>
  );
}