import "./campaign.css";
import { BreadcrumbStructuredData } from "@/components/breadcrumb-structured-data";
import { PageHero } from "@/components/page-hero";
import { ProgrammeDetail } from "@/components/programme-detail";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { programmeBySlug } from "@/lib/master-copy";
import { canRenderPublicMedia, resolvePublicMediaUrl } from "@/lib/public-media";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getInitiativePageData } from "@/lib/public-page-data";
import { buildPublicRecordFallback, distinctStoryParagraphs, heroTeaser } from "@/lib/public-copy";
import { CampaignMediaGallery } from "@/components/campaign-media-gallery";
import { canExposePublicAppeal } from "@/lib/public-environment";

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
  return { title: initiative.title, description: initiative.summary, alternates: { canonical }, openGraph: { type: "article", url: canonical, title: initiative.title, description: initiative.summary, images: leadImage ? [{ url: leadImage, alt: initiative.mediaAssets.find(asset => asset.publicUrl === leadImage)?.altText ?? initiative.title }] : undefined }, twitter: { card: leadImage ? "summary_large_image" : "summary", title: initiative.title, description: initiative.summary, images: leadImage ? [leadImage] : undefined } };
}

export default async function InitiativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (["winter-drive-2025-26", "winter-relief-2025-26"].includes(slug)) permanentRedirect("/our-work/winter-relief");
  if (programmeBySlug(slug)) return <ProgrammeDetail slug={slug} />;
  const initiative = await getInitiativePageData(slug);
  if (!initiative) notFound();

  const media = initiative.mediaAssets.filter(canRenderPublicMedia).filter((asset,index,list)=>list.findIndex(other=>resolvePublicMediaUrl(other)===resolvePublicMediaUrl(asset))===index);
  const leadMedia = media.find(asset => asset.kind === "IMAGE");
  const gallery = media.filter(asset => asset.id !== leadMedia?.id);
  const period = formatYears(initiative.startYear, initiative.endYear, initiative.year);
  const paragraphs = distinctStoryParagraphs("", initiative.story || initiative.summary);
  const fallbackStory = buildPublicRecordFallback({ title: initiative.title, status: period, metric: initiative.primaryMetric, metricLabel: initiative.primaryMetricLabel });
  const activeAppeals = initiative.appeals.filter(appeal => appeal.status === "PUBLISHED" && canExposePublicAppeal(appeal));
  const isTaleemInitiative = initiative.slug.startsWith("taleem-");

  return (
    <div className="v2-home campaign-page">
      <BreadcrumbStructuredData items={[{ name: "Home", path: "/" }, { name: "Our Work", path: "/our-work" }, { name: initiative.title, path: `/our-work/${initiative.slug}` }]} />
      <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/our-work">Our work</Link><span aria-hidden="true"> / </span><span>{initiative.title}</span></nav></div>
      <PageHero variant="level2" eyebrow={`${initiative.cause.title} · ${period}`} title={initiative.title} description={<p>{heroTeaser(initiative.summary)}</p>} actions={[{label:"Read about the drive",href:"#campaign-story"},...(gallery.length>0?[{label:"View media and updates",href:"#campaign-gallery",secondary:true} as const]:[])]} visual={leadMedia ? <PublicMedia asset={leadMedia} priority /> : <WorkVisualPlaceholder label={initiative.title} className="campaign-lead-placeholder" />} />

      <section className="campaign-story v2-shell" id="campaign-story"><div><h2>What happened</h2>{initiative.primaryMetric && <div className="campaign-outcome"><strong>{initiative.primaryMetric}</strong><p>{initiative.primaryMetricLabel}</p></div>}</div><div className="campaign-story-copy">{paragraphs.length > 0 ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{fallbackStory}</p>}</div></section>

      {gallery.length > 0 && <section className="campaign-gallery" id="campaign-gallery"><div className="v2-shell"><div className="campaign-section-heading"><h2>From the drive</h2><p>Original photographs, privacy-protected videos and campaign updates from this edition.</p></div><CampaignMediaGallery items={gallery.filter(asset => asset.kind === "IMAGE").map(asset => ({ id: asset.id, url: resolvePublicMediaUrl(asset) ?? "", alt: asset.altText, caption: asset.caption })).filter(item => Boolean(item.url))} /><div className="campaign-gallery-grid">{gallery.filter(asset => asset.kind !== "IMAGE").map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div></div></section>}

      {initiative.stories.length > 0 && <section className="campaign-related v2-shell"><h2>Stories connected to this work</h2><div className="v2-field-grid">{initiative.stories.map(story => <Link className="v2-field-story" href={`/stories/${story.slug}`} key={story.id}><h3>{story.title}</h3><p>{story.summary}</p><span className="v2-text-link">Read the story</span></Link>)}</div></section>}
      {initiative.faithContent.length > 0 && <section className="campaign-related v2-shell"><h2>Faith and reflections</h2>{initiative.faithContent.map(item => <article key={item.id}><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/faith-and-reflections/${item.slug}`}>Read reflection</Link></article>)}</section>}
      {isTaleemInitiative && <section className="campaign-related v2-shell"><p className="v2-section-label">Continue the work</p><h2>Sponsor a student through Amaana Taleem.</h2><p>Explore sponsorship for Hifdh, Quran Nazira, or a child’s school or college education.</p><Link className="v2-button" href="/get-involved/sponsor-education">Explore education sponsorship</Link></section>}
      <section className="campaign-next"><div className="v2-shell"><h2>Be part of what comes next.</h2><p>Explore more of Amaana’s work or contribute your time and skills.</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore all our work</Link><Link className="v2-text-link" href="/get-involved">Volunteer with Amaana</Link></div>{activeAppeals.length > 0 && <div className="campaign-appeals"><h3>Current appeals connected to this work</h3>{activeAppeals.map(appeal => <p key={appeal.id}><Link href={`/appeals/${appeal.slug}`}>{appeal.title}</Link></p>)}</div>}</div></section>
    </div>
  );
}
