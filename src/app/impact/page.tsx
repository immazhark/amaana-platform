import evidenceStyles from "@/components/evidence-pathway.module.css";
import { SectionHeading } from "@/components/section-heading";
import { BodyCarousel } from "@/components/body-carousel";
import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import ArchiveLink from "next/link";
import { PageHero, PAGE_HERO_IMAGE_SIZES } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { TrustEvidenceBoundary } from "@/components/trust-evidence-boundary";
import { VerifiedImpactStrip } from "@/components/verified-impact-strip";
import { programmeBySlug } from "@/lib/master-copy";
import { getImpactPageData } from "@/lib/public-page-data";
import { selectIdentityPublicImage } from "@/lib/public-media";
import { selectImpactWitnesses } from "@/lib/impact-witnesses";
import { getPublishedAnonymousOutcomeNotes } from "@/lib/public-anonymous-outcomes";
import { ANONYMOUS_OUTCOME_COPY } from "@/lib/assistance-outcome-disclosure";
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
  // Separate, bounded public-only projection. It never adds to impact metrics.
  const [rawInitiatives, anonymousNotes] = await Promise.all([
    getImpactPageData(), getPublishedAnonymousOutcomeNotes(),
  ]);
  const initiatives = rawInitiatives.filter(item => {
    const canonical = programmeBySlug(item.slug);
    return Boolean(canonical) && !(canonical && "parentSlug" in canonical && canonical.parentSlug);
  });
  // A reviewed initiative's own published metric is the only source of
  // truth here. No pooled amount, newly estimated impact or extra query.
  const publishedImpact = initiatives
    .filter(item => item.primaryMetric?.trim() && item.primaryMetricLabel?.trim())
    .slice(0, 3)
    .map(item => ({
      slug: item.slug, title: item.title,
      value: item.primaryMetric!, label: item.primaryMetricLabel!,
    }));
  const witnesses = selectImpactWitnesses(initiatives);
  const heroMedia = witnesses[0]?.media ?? null;

  return (
    <div className="v2-home v2-impact-page">
      <PageHero
        variant="level1"
        eyebrow="Impact · Evidence · Continuity"
        title="Impact, initiative by initiative."
        description={<p>See what each Amaana initiative achieved, with the year, programme and known outcome kept together so the numbers retain their meaning.</p>}
        actions={[
          { label: "Follow the evidence", href: "#evidence" },
          { label: "How we report", href: "/transparency", secondary: true },
        ]}
        visual={heroMedia ? <PublicMedia asset={heroMedia} priority sizes={PAGE_HERO_IMAGE_SIZES} /> : (
          <div className="page-hero__visual-fallback page-hero__visual-fallback--impact">
            <span>Evidence chain</span>
            <strong>Need → Trust → Action → Outcome</strong>
            <small>Every published figure stays attached to the initiative, year and known result that gives it meaning.</small>
            <i />
          </div>
        )}
      />

      {publishedImpact.length > 0 && <div className="v2-shell">
        <VerifiedImpactStrip headingId="impact-published-outcomes" items={publishedImpact}/>
      </div>}

      <section className="v2-section paper v2-impact-wall-section" id="evidence" aria-labelledby="impact-wall-title">
        <div className="v2-shell">
          <TrustEvidenceBoundary context="impact" className={evidenceStyles.boundary} />
          <SectionHeading eyebrow={<>Wall of impact</>} title={<>See what each initiative achieved.</>} subtitle={<>Explore an outcome, then open the initiative to understand the work behind it.</>} id="impact-wall-title" />
          {initiatives.length > 0 ? <div className="v2-impact-wall">{initiatives.map((item, index) => {
            const thumbnail = selectIdentityPublicImage(item.mediaAssets) ?? null;
            return <ArchiveLink href={`/our-work/${item.slug}`} className={`v2-impact-tile ${thumbnail ? "has-media" : ""}`} key={item.id} aria-label={`Explore impact: ${item.title}`}>
              {thumbnail ? <div className="v2-impact-tile-media" aria-hidden="true"><PublicMedia asset={thumbnail} sizes="(max-width: 620px) 100vw, (max-width: 1050px) 50vw, 34vw" /></div> : null}
              <div className="v2-impact-tile-shade" aria-hidden="true" />
              <span className="v2-impact-tile-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="v2-impact-tile-copy"><small>{item.cause.title}</small>{item.primaryMetric ? <strong>{item.primaryMetric}</strong> : null}<span>{item.primaryMetricLabel ?? item.title}</span><h3>{item.title}</h3></div>
              <span className="v2-impact-tile-action" aria-hidden="true">Explore impact ↗</span>
            </ArchiveLink>;
          })}</div> : <div className="v2-reminder v2-light-reminder"><span className="v2-reminder-label">Impact updates</span><h3>No initiative outcomes are published here yet.</h3><p>Outcomes will appear here when they are ready to share.</p></div>}
        </div>
      </section>

      {anonymousNotes.length > 0 && (
        <section className="v2-section paper" aria-labelledby="anonymous-support-notes">
          <div className="v2-shell">
            <SectionHeading
              id="anonymous-support-notes"
              eyebrow={<>Consent-reviewed updates</>}
              title={<>Small outcomes. Protected identities.</>}
              subtitle={<>These short, anonymous notes were released through a separate
                consent and staff-publication decision. They do not imply recovery,
                complete case resolution or independently audited financial settlement.</>}
            />
            <div className="v2-impact-principles">
              {anonymousNotes.map(copy => (
                <article key={copy}>
                  <h3>{copy === ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT
                    ? "Partial support"
                    : copy === ANONYMOUS_OUTCOME_COPY.SPECIFIC_SUPPORT_COMPLETED
                      ? "A support action completed" : "Further follow-up"}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {witnesses.length > 0 && <section className="v2-section dark v2-impact-witness" aria-labelledby="witness-title"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Witness the work</p></div><p className="v2-section-intro">Only photographs suitable for public sharing appear here. Personal documents and sensitive verification material remain private.</p></div><BodyCarousel heading={<h2 className="v2-section-title" id="witness-title">Evidence can be seen, not just counted.</h2>} label="Documented impact photographs" className="v2-impact-witness-carousel">{witnesses.map(({ item, media }) => <ArchiveLink href={`/our-work/${item.slug}`} className="v2-impact-witness-item" key={item.id} aria-label={`Open ${item.title}`}><PublicMedia asset={media} sizes="(max-width: 700px) 86vw, (max-width: 1200px) 46vw, 31vw" /><div><small>{item.cause.title}</small><h3>{item.title}</h3><span>Explore this work →</span></div></ArchiveLink>)}</BodyCarousel></div></section>}

      <section className="v2-section v2-impact-philosophy">
        <div className="v2-shell v2-impact-philosophy-grid">
          <div><p className="v2-section-label">What counts as impact?</p><h2 className="v2-section-title">The outcome matters.<br />So does the way it was reached.</h2></div>
          <div className="v2-impact-principles"><article><span>01</span><h3>Specificity</h3><p>Year, initiative and known outcome stay attached to the figure.</p></article><article><span>02</span><h3>Dignity</h3><p>Private proofs remain private even when the public outcome is documented.</p></article><article><span>03</span><h3>Continuity</h3><p>Completed work remains visible so its outcome can still be understood after a campaign ends.</p></article><article><span>04</span><h3>Restraint</h3><p>Missing information stays missing until it can be responsibly supported.</p></article></div>
        </div>
      </section>

      <section className={`v2-section dark v2-impact-trust ${evidenceStyles.surface}`}><div className={`v2-shell ${evidenceStyles.grid}`}><div><p className="v2-section-label">Transparency</p><h2 className="v2-section-title">Follow trust from support to outcome.</h2><p className="v2-section-intro">The public evidence trail is designed to explain what happened without publishing identity documents, medical records, bank details or private verification material.</p><Link className="v2-button" href="/transparency">Explore transparency</Link></div><div className="v2-reminder"><span className="v2-reminder-label">The evidence chain</span><blockquote>Need → trust → preparation → delivery → known outcome.</blockquote><p>Public evidence. Private proofs.</p></div></div></section>
    </div>
  );
}