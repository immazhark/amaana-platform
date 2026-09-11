import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

function formatYears(startYear: number | null, endYear: number | null, year: number | null) {
  if (year) return String(year);
  if (startYear && endYear) return startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
  if (startYear) return `${startYear} onward`;
  return "Documented initiative";
}

export default async function InitiativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initiative = await getPublishedInitiativeBySlug(slug);
  if (!initiative) notFound();

  const leadMedia = initiative.mediaAssets[0];
  const galleryMedia = initiative.mediaAssets.slice(1);
  const period = formatYears(initiative.startYear, initiative.endYear, initiative.year);

  return (
    <div className="v2-home v2-initiative-page">
      <section className="v2-initiative-hero dark">
        <div className="v2-shell v2-initiative-hero-grid">
          <div className="v2-initiative-hero-copy">
            <p className="v2-section-label">{initiative.cause.title} · {period}</p>
            <h1 className="v2-display">{initiative.title}</h1>
            <p className="v2-hero-copy">{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#initiative-story">Follow the work</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>

          <div className="v2-initiative-hero-evidence">
            {leadMedia ? (
              <PublicMedia asset={leadMedia} />
            ) : (
              <div className="v2-initiative-evidence-panel">
                <span>{initiative.cause.title}</span>
                {initiative.primaryMetric ? <strong>{initiative.primaryMetric}</strong> : <strong>{period}</strong>}
                <p>{initiative.primaryMetricLabel ?? "Public record in preparation"}</p>
                <small>Authentic media appears only after provenance, privacy and public-use approval.</small>
              </div>
            )}
          </div>
        </div>

        <div className="v2-shell v2-initiative-facts">
          <div><span>Cause</span><strong>{initiative.cause.title}</strong></div>
          <div><span>Period</span><strong>{period}</strong></div>
          <div><span>Primary evidence</span><strong>{initiative.primaryMetric ?? "Documented work"}</strong><small>{initiative.primaryMetricLabel}</small></div>
        </div>
      </section>

      <section className="v2-section paper" id="initiative-story">
        <div className="v2-shell v2-initiative-story-grid">
          <div>
            <p className="v2-section-label">The initiative</p>
            <h2 className="v2-section-title">The work behind the number.</h2>
          </div>
          <div className="v2-initiative-story-copy">
            <p>{initiative.story}</p>
            <div className="v2-initiative-trust-note">
              <span>How to read this page</span>
              <p>Figures, photographs, stories and reflections are shown only when their own publication and privacy requirements are satisfied. Missing detail is left missing rather than guessed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-initiative-gallery">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Field record</p><h2 className="v2-section-title">See the work as it was documented.</h2></div>
            <p className="v2-section-intro">Amaana uses authentic, approved material from the initiative itself. Beneficiary dignity comes before visual drama.</p>
          </div>

          {galleryMedia.length > 0 ? (
            <div className="v2-media-grid v2-media-grid-editorial" aria-label={`${initiative.title} approved media`}>
              {galleryMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}
            </div>
          ) : leadMedia ? (
            <p className="v2-initiative-media-note">The approved lead asset appears above. Additional reviewed media will be added when available.</p>
          ) : (
            <div className="v2-reminder"><span className="v2-reminder-label">Publication gate active</span><blockquote>Authentic material only.</blockquote><p>No image, video or document is substituted simply to make the page look fuller.</p></div>
          )}
        </div>
      </section>

      {initiative.stories.length > 0 && (
        <section className="v2-section v2-initiative-stories">
          <div className="v2-shell">
            <div className="v2-section-head">
              <div><p className="v2-section-label">Stories of Amanah</p><h2 className="v2-section-title">Moments that carry the work forward.</h2></div>
              <p className="v2-section-intro">These are privacy-approved public stories linked directly to this initiative.</p>
            </div>
            <div className="v2-field-grid">
              {initiative.stories.map(story => (
                <Link className="v2-field-story" href={`/stories/${story.slug}`} key={story.id}>
                  <span className="v2-field-date">Story</span>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  <span className="v2-text-link">Read the story →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {initiative.faithContent.length > 0 && (
        <section className="v2-section paper v2-initiative-faith">
          <div className="v2-shell">
            <div className="v2-section-head">
              <div><p className="v2-section-label">Faith & Reflections</p><h2 className="v2-section-title">Meaning connected to the work.</h2></div>
              <p className="v2-section-intro">Only published and religiously reviewed material appears here.</p>
            </div>
            <div className="v2-initiative-faith-grid">
              {initiative.faithContent.map(item => (
                <article key={item.id}>
                  <small>{item.type.toLowerCase()}</small>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue the journey</p>
          <h2>See where this work sits within Amaana&apos;s wider amanah.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore all work</Link>
            <Link className="v2-text-link" href="/impact">See documented impact →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
