import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbStructuredData } from "@/components/breadcrumb-structured-data";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { CampaignMediaGallery } from "@/components/campaign-media-gallery";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { PublicContentStructuredData } from "@/components/public-content-structured-data";
import { getStoryPageData } from "@/lib/public-page-data";
import { canRenderPublicMedia, resolvePublicMediaUrl, selectIdentityPublicImage } from "@/lib/public-media";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryPageData(slug);
  if (!story) return { title: "Story not found" };
  const canonical = `/stories/${story.slug}`;
  const identity = selectIdentityPublicImage(story.mediaAssets);
  const leadImage = identity ? resolvePublicMediaUrl(identity) ?? undefined : undefined;
  const leadAlt = identity?.altText ?? story.title;
  return { title: story.title, description: story.summary, alternates: { canonical }, openGraph: { type: "article", url: canonical, title: `${story.title} | Amaana Foundation`, description: story.summary, publishedTime: story.publishedAt?.toISOString(), images: leadImage ? [{ url: leadImage, alt: leadAlt }] : undefined }, twitter: { card: leadImage ? "summary_large_image" : "summary", title: `${story.title} | Amaana Foundation`, description: story.summary, images: leadImage ? [leadImage] : undefined } };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getStoryPageData(slug);
  if (!story) notFound();
  const publishedDate = story.publishedAt ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(story.publishedAt) : null;
  const publicMedia = story.mediaAssets.filter(canRenderPublicMedia);
  const leadMedia = selectIdentityPublicImage(publicMedia);
  const remainingMedia = publicMedia.filter(asset => asset.id !== leadMedia?.id);
  const remainingImages = remainingMedia.filter(asset => asset.kind === "IMAGE");
  const remainingOtherMedia = remainingMedia.filter(asset => asset.kind !== "IMAGE");
  const relatedInitiative = story.initiative?.status === "PUBLISHED" && story.initiative.cause.status === "PUBLISHED" ? story.initiative : null;
  const relatedCause = story.cause?.status === "PUBLISHED" ? story.cause : null;
  const context = relatedInitiative?.title ?? relatedCause?.title ?? "Amaana field journal";

  return (
    <div className="v2-home v2-story-detail-page">
      <PublicContentStructuredData
        type="Article"
        title={story.title}
        description={story.summary}
        path={`/stories/${story.slug}`}
        publishedAt={story.publishedAt}
        modifiedAt={story.updatedAt}
        imageUrl={leadMedia ? resolvePublicMediaUrl(leadMedia) : null}
        section="Stories of Amanah"
      />
      <BreadcrumbStructuredData items={[{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }, { name: story.title, path: `/stories/${story.slug}` }]} />
      <PageHero
        variant="level2"
        eyebrow={`Stories of Amanah${publishedDate ? ` · ${publishedDate}` : ""}`}
        title={story.title}
        description={<p>{story.summary}</p>}
        actions={[{ label: "Back to field journal", href: "/stories", secondary: true }]}
        visual={leadMedia ? <PublicMedia asset={leadMedia} priority /> : undefined}
        visualKicker="Field note · Privacy reviewed"
        visualTitle={context}
        visualNote={story.mediaAssets.length > 0 ? `${story.mediaAssets.length} approved ${story.mediaAssets.length === 1 ? "asset" : "assets"}` : "This account does not need a person’s image to be worth documenting."}
      />

      <section className="v2-story-detail-body"><div className="v2-shell v2-story-detail-body-grid"><aside><p className="v2-section-label">Documented account</p><h2>What Amaana knows and can responsibly share.</h2><div className="v2-story-detail-rule"><span>Fact</span><p>Keep the account attached to documented information.</p></div><div className="v2-story-detail-rule"><span>Dignity</span><p>Leave private proofs and unnecessary identity details outside the public story.</p></div></aside><article className="v2-story-detail-prose"><div className="v2-story-detail-dropcap" aria-hidden="true">A</div><p>{story.body}</p>{story.sourceNote && <div className="v2-story-source-note"><span>Source note</span><p>{story.sourceNote}</p></div>}</article></div></section>

      {remainingMedia.length > 0 && <section className="v2-story-detail-gallery"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Approved field record</p><h2 className="v2-section-title">Only what cleared the public-use gate.</h2></div><p className="v2-section-intro">These assets belong to the documented account and have been separately cleared for public display.</p></div>{remainingImages.length > 0 ? <CampaignMediaGallery items={remainingImages.map(asset => ({ id: asset.id, url: resolvePublicMediaUrl(asset) ?? "", alt: asset.altText, caption: asset.caption })).filter(item => Boolean(item.url))} /> : null}{remainingOtherMedia.length > 0 ? <ScrollCarousel label={`${story.title} supporting media`} mode="cards">{remainingOtherMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</ScrollCarousel> : null}</div></section>}

      <section className="v2-story-detail-ethic"><div className="v2-shell v2-story-detail-ethic-grid"><div><p className="v2-section-label">Editorial boundary</p><h2>Evidence without exposure.</h2></div><p>Stories can explain the work without turning vulnerability into spectacle. Private documents stay private, identity details are minimized, and public media is optional rather than assumed.</p></div></section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Continue the journey</p><h2>One account belongs to a wider body of work.</h2><div className="v2-hero-actions" style={{ justifyContent: "center" }}>{relatedInitiative && <Link className="v2-button" href={`/our-work/${relatedInitiative.slug}`}>View this initiative</Link>}<Link className="v2-text-link" href="/stories">Return to the field journal →</Link></div></div></section>
    </div>
  );
}
