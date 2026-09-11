import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedStoryBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) notFound();

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Stories of Amanah</p>
          <h1 className="v2-display" style={{ maxWidth: "10ch" }}>{story.title}</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>{story.summary}</p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Documented account</p>
              <h2 className="v2-section-title">What Amaana knows and can responsibly share.</h2>
            </div>
            <p className="v2-section-intro">{story.body}</p>
          </div>

          {story.mediaAssets.length > 0 && (
            <div className="v2-work-grid" aria-label={`${story.title} media`}>
              {story.mediaAssets.map(asset => (
                <article className="v2-work-card" key={asset.id}>
                  <small>{asset.kind.toLowerCase()}</small>
                  <div>
                    <h3>{asset.title ?? story.title}</h3>
                    {asset.caption && <p>{asset.caption}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {story.sourceNote && (
            <p className="v2-section-intro" style={{ marginTop: "2rem" }}>
              Source note: {story.sourceNote}
            </p>
          )}
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue exploring</p>
          <h2>See the wider work around this story.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            {story.initiative && <Link className="v2-button" href={`/our-work/${story.initiative.slug}`}>View initiative</Link>}
            <Link className="v2-text-link" href="/stories">All stories →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
