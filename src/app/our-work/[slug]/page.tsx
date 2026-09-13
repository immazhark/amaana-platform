import "./campaign.css";
import { canRenderPublicMedia, resolvePublicMediaUrl } from "@/lib/public-media";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getInitiativePageData } from "@/lib/public-page-data";

export const dynamic = "force-dynamic";

function formatYears(startYear: number | null, endYear: number | null, year: number | null) {
  if (year) return String(year);
  if (startYear && endYear) return startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
  if (startYear) return `${startYear} onward`;
  return "Documented initiative";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const initiative = await getInitiativePageData(slug);
  if (!initiative) return { title: "Initiative not found" };

  const canonical = `/our-work/${initiative.slug}`;
  const leadImage = initiative.mediaAssets.find(asset => asset.kind === "IMAGE" && asset.publicUrl)?.publicUrl ?? undefined;

  return {
    title: initiative.title,
    description: initiative.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: initiative.title,
      description: initiative.summary,
      images: leadImage ? [{ url: leadImage, alt: initiative.mediaAssets.find(asset => asset.publicUrl === leadImage)?.altText ?? initiative.title }] : undefined,
    },
    twitter: {
      card: leadImage ? "summary_large_image" : "summary",
      title: initiative.title,
      description: initiative.summary,
      images: leadImage ? [leadImage] : undefined,
    },
  };
}

export default async function InitiativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initiative = await getInitiativePageData(slug);
  if (!initiative) notFound();

  const media = initiative.mediaAssets.filter(canRenderPublicMedia);
  const leadMedia = media.find(asset => asset.kind === "IMAGE");
  const gallery = media.filter(asset => asset.id !== leadMedia?.id);
  const period = formatYears(initiative.startYear, initiative.endYear, initiative.year);
  const paragraphs = initiative.story.split(/\n\s*\n/).filter(Boolean);
  const activeAppeals = initiative.appeals.filter(appeal => appeal.status === "PUBLISHED");

  return (
    <div className="v2-home campaign-page">
      <div className="v2-shell campaign-breadcrumb">
        <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/our-work">Our work</Link><span aria-hidden="true"> / </span><span>{initiative.title}</span></nav>
      </div>
      <section className="campaign-hero">
        <div className="v2-shell campaign-hero-grid">
          <div className="campaign-heading">
            <h1>{initiative.title}</h1>
            <p className="campaign-period">{initiative.cause.title} · {period}</p>
            <p className="campaign-summary">{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#campaign-story">Read about the drive</a>
              {gallery.length > 0 && <a className="v2-text-link" href="#campaign-gallery">View photographs and updates</a>}
            </div>
          </div>
          {leadMedia && <div className="campaign-lead"><PublicMedia asset={leadMedia} priority /></div>}
        </div>
      </section>

      <section className="campaign-story v2-shell" id="campaign-story">
        <div>
          <h2>What happened</h2>
          {initiative.primaryMetric && <div className="campaign-outcome"><strong>{initiative.primaryMetric}</strong><p>{initiative.primaryMetricLabel}</p></div>}
        </div>
        <div className="campaign-story-copy">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </section>

      {gallery.length > 0 && (
        <section className="campaign-gallery" id="campaign-gallery">
          <div className="v2-shell">
            <div className="campaign-section-heading"><h2>From the drive</h2><p>Original photographs and campaign updates. Open an image to see it in full.</p></div>
            <div className="campaign-gallery-grid">
              {gallery.map(asset => {
                const url = resolvePublicMediaUrl(asset);
                return asset.kind === "IMAGE" && url ? (
                  <a className="campaign-image-link" href={url} target="_blank" rel="noopener noreferrer" key={asset.id} aria-label={`View full image: ${asset.altText} (opens in a new tab)`}>
                    <PublicMedia asset={asset} />
                    <span className="campaign-open">View full image</span>
                  </a>
                ) : <PublicMedia asset={asset} key={asset.id} />;
              })}
            </div>
          </div>
        </section>
      )}

      {initiative.stories.length > 0 && (
        <section className="campaign-related v2-shell">
          <h2>Stories connected to this work</h2>
          <div className="v2-field-grid">{initiative.stories.map(story => <Link className="v2-field-story" href={`/stories/${story.slug}`} key={story.id}><h3>{story.title}</h3><p>{story.summary}</p><span className="v2-text-link">Read the story</span></Link>)}</div>
        </section>
      )}
      {initiative.faithContent.length > 0 && (
        <section className="campaign-related v2-shell"><h2>Faith and reflections</h2>{initiative.faithContent.map(item => <article key={item.id}><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/faith-and-reflections/${item.slug}`}>Read reflection</Link></article>)}</section>
      )}
      <section className="campaign-next">
        <div className="v2-shell">
          <h2>Be part of what comes next.</h2>
          <p>Explore more of Amaana’s work or contribute your time and skills.</p>
          <div className="v2-hero-actions">
            <Link className="v2-button" href="/our-work">Explore all our work</Link>
            <Link className="v2-text-link" href="/get-involved">Volunteer with Amaana</Link>
          </div>
          {activeAppeals.length > 0 && <div className="campaign-appeals"><h3>Current appeals connected to this work</h3>{activeAppeals.map(appeal => <p key={appeal.id}><Link href={`/appeals/${appeal.slug}`}>{appeal.title}</Link></p>)}</div>}
        </div>
      </section>
    </div>
  );
}
