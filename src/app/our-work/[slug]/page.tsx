import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function InitiativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initiative = await getPublishedInitiativeBySlug(slug);

  if (!initiative) notFound();

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">{initiative.cause.title}</p>
          <h1 className="v2-display" style={{ maxWidth: "10ch" }}>{initiative.title}</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>{initiative.summary}</p>
          {initiative.primaryMetric && (
            <div className="v2-hero-proof" style={{ marginTop: "2.5rem" }}>
              <div>
                <span className="v2-proof-number">{initiative.primaryMetric}</span>
                <span className="v2-proof-copy">{initiative.primaryMetricLabel}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">The initiative</p>
              <h2 className="v2-section-title">The work behind the number.</h2>
            </div>
            <p className="v2-section-intro">{initiative.story}</p>
          </div>

          {initiative.mediaAssets.length > 0 ? (
            <div className="v2-media-grid" aria-label={`${initiative.title} approved media`}>
              {initiative.mediaAssets.map(asset => <PublicMedia asset={asset} key={asset.id} />)}
            </div>
          ) : (
            <p className="v2-section-intro">No media is shown until provenance, privacy and public-use approval are recorded.</p>
          )}
        </div>
      </section>

      {initiative.stories.length > 0 && (
        <section className="v2-section">
          <div className="v2-shell">
            <p className="v2-section-label">Stories of Amanah</p>
            <h2 className="v2-section-title">Documented moments from this work.</h2>
            <div className="v2-work-grid" style={{ marginTop: "2rem" }}>
              {initiative.stories.map(story => (
                <Link className="v2-work-card" href={`/stories/${story.slug}`} key={story.id}>
                  <small>Story</small>
                  <div><h3>{story.title}</h3><p>{story.summary}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {initiative.faithContent.length > 0 && (
        <section className="v2-section dark v2-faith">
          <div className="v2-shell">
            <p className="v2-section-label">Faith & Reflections</p>
            <h2 className="v2-section-title">Verified reflections connected to this work.</h2>
            <div className="v2-work-grid" style={{ marginTop: "2rem" }}>
              {initiative.faithContent.map(item => (
                <article className="v2-work-card" key={item.id}>
                  <small>{item.type.toLowerCase()}</small>
                  <div><h3>{item.title}</h3><p>{item.excerpt}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue exploring</p>
          <h2>See how this initiative fits into Amaana&apos;s wider work.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">All initiatives</Link>
            <Link className="v2-text-link" href="/impact">Explore impact →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
