import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedStoryBySlug } from "@/lib/public-content";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) return { title: "Story not found" };

  const canonical = `/stories/${story.slug}`;
  const leadImage = story.mediaAssets.find(asset => asset.kind === "IMAGE" && asset.publicUrl)?.publicUrl ?? undefined;
  const leadAlt = leadImage ? story.mediaAssets.find(asset => asset.publicUrl === leadImage)?.altText ?? story.title : undefined;

  return {
    title: story.title,
    description: story.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: story.title,
      description: story.summary,
      publishedTime: story.publishedAt?.toISOString(),
      images: leadImage ? [{ url: leadImage, alt: leadAlt }] : undefined,
    },
    twitter: {
      card: leadImage ? "summary_large_image" : "summary",
      title: story.title,
      description: story.summary,
      images: leadImage ? [leadImage] : undefined,
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();

  const publishedDate = story.publishedAt
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(story.publishedAt)
    : null;
  const leadMedia = story.mediaAssets[0] ?? null;
  const remainingMedia = story.mediaAssets.slice(1);
  const context = story.initiative?.title ?? story.cause?.title ?? "Amaana field journal";

  return (
    <div className="v2-home v2-story-detail-page">
      <section className="v2-story-detail-hero">
        <div className="v2-shell v2-story-detail-hero-grid">
          <div className="v2-story-detail-heading">
            <Link href="/stories" className="v2-story-detail-back">← Field journal</Link>
            <p className="v2-section-label">Stories of Amanah{publishedDate ? ` · ${publishedDate}` : ""}</p>
            <h1>{story.title}</h1>
            <p>{story.summary}</p>
          </div>
          <aside className="v2-story-detail-context" aria-label="Story context">
            <span>Field note</span>
            <strong>{context}</strong>
            <div><small>Publication</small><b>Privacy reviewed</b></div>
            <div><small>Media</small><b>{story.mediaAssets.length > 0 ? `${story.mediaAssets.length} approved ${story.mediaAssets.length === 1 ? "asset" : "assets"}` : "No public media"}</b></div>
          </aside>
        </div>
      </section>

      <section className="v2-story-detail-lead">
        <div className="v2-shell">
          {leadMedia ? (
            <div className="v2-story-detail-lead-media"><PublicMedia asset={leadMedia} priority /></div>
          ) : (
            <div className="v2-story-detail-no-media">
              <span>Privacy can be part of the evidence.</span>
              <strong>This account does not need a person&apos;s image to be worth documenting.</strong>
              <p>Amaana publishes media only when the asset has passed its own public-use and privacy review.</p>
            </div>
          )}
        </div>
      </section>

      <section className="v2-story-detail-body">
        <div className="v2-shell v2-story-detail-body-grid">
          <aside>
            <p className="v2-section-label">Documented account</p>
            <h2>What Amaana knows and can responsibly share.</h2>
            <div className="v2-story-detail-rule"><span>Fact</span><p>Keep the account attached to documented information.</p></div>
            <div className="v2-story-detail-rule"><span>Dignity</span><p>Leave private proofs and unnecessary identity details outside the public story.</p></div>
          </aside>
          <article className="v2-story-detail-prose">
            <div className="v2-story-detail-dropcap" aria-hidden="true">A</div>
            <p>{story.body}</p>
            {story.sourceNote && <div className="v2-story-source-note"><span>Source note</span><p>{story.sourceNote}</p></div>}
          </article>
        </div>
      </section>

      {remainingMedia.length > 0 && (
        <section className="v2-story-detail-gallery">
          <div className="v2-shell">
            <div className="v2-section-head">
              <div><p className="v2-section-label">Approved field record</p><h2 className="v2-section-title">Only what cleared the public-use gate.</h2></div>
              <p className="v2-section-intro">These assets belong to the documented account and have been separately cleared for public display.</p>
            </div>
            <div className="v2-story-detail-media-grid" aria-label={`${story.title} approved media`}>
              {remainingMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}
            </div>
          </div>
        </section>
      )}

      <section className="v2-story-detail-ethic">
        <div className="v2-shell v2-story-detail-ethic-grid">
          <div><p className="v2-section-label">Editorial boundary</p><h2>Evidence without exposure.</h2></div>
          <p>Stories can explain the work without turning vulnerability into spectacle. Private documents stay private, identity details are minimized, and public media is optional rather than assumed.</p>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue the journey</p>
          <h2>One account belongs to a wider body of work.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            {story.initiative && <Link className="v2-button" href={`/our-work/${story.initiative.slug}`}>View this initiative</Link>}
            <Link className="v2-text-link" href="/stories">Return to the field journal →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
