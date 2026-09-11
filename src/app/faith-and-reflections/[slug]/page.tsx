import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedFaithContentBySlug } from "@/lib/public-content";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedFaithContentBySlug(slug);
  if (!item) return { title: "Reflection not found" };

  const canonical = `/faith-and-reflections/${item.slug}`;
  const leadImage = item.mediaAssets.find(asset => asset.kind === "IMAGE" && asset.publicUrl)?.publicUrl ?? undefined;
  const leadAlt = leadImage ? item.mediaAssets.find(asset => asset.publicUrl === leadImage)?.altText ?? item.title : undefined;

  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: item.title,
      description: item.excerpt,
      publishedTime: item.publishedAt?.toISOString(),
      images: leadImage ? [{ url: leadImage, alt: leadAlt }] : undefined,
    },
    twitter: {
      card: leadImage ? "summary_large_image" : "summary",
      title: item.title,
      description: item.excerpt,
      images: leadImage ? [leadImage] : undefined,
    },
  };
}

export default async function FaithDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublishedFaithContentBySlug(slug);
  if (!item) notFound();

  const publishedDate = item.publishedAt
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(item.publishedAt)
    : null;
  const topics = item.topics.map(link => link.topic.name);

  return <div className="v2-home v2-faith-detail-page">
    <section className="v2-faith-detail-hero"><div className="v2-shell v2-faith-detail-hero-grid"><div><Link className="v2-faith-detail-back" href="/faith-and-reflections">← Faith & Reflections</Link><p className="v2-section-label">{item.type.toLowerCase()}{publishedDate ? ` · ${publishedDate}` : ""}</p><h1>{item.title}</h1><p>{item.excerpt}</p>{topics.length > 0 && <div className="v2-faith-detail-topics">{topics.map(topic => <span key={topic}>{topic}</span>)}</div>}</div><aside><span>Editorial trust</span><strong>Published only after religious review.</strong><p>Amaana shares reviewed beneficial material without presenting itself as a scholarly authority.</p></aside></div></section>

    <section className="v2-section paper"><div className="v2-shell v2-faith-detail-body-grid"><aside><p className="v2-section-label">Review context</p>{item.sourceCitation ? <div className="v2-faith-detail-source"><span>Source citation</span><p>{item.sourceCitation}</p></div> : <p className="v2-faith-detail-muted">No separate source citation is displayed for this item.</p>}{item.verifiedAt && <p className="v2-faith-detail-muted">Religious review verified {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(item.verifiedAt)}.</p>}</aside><article><p className="v2-section-label">Reflection</p>{item.body ? <div className="v2-faith-detail-body">{item.body}</div> : <p className="v2-faith-detail-body">{item.excerpt}</p>}</article></div></section>

    {item.mediaAssets.length > 0 && <section className="v2-section dark"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Reviewed media</p><h2 className="v2-section-title">Visual context, separately approved.</h2></div><p className="v2-section-intro">Media appears here only when its own public-use and privacy checks are satisfied.</p></div><div className="v2-media-grid">{item.mediaAssets.map((asset, index) => <PublicMedia asset={asset} key={asset.id} priority={index === 0} />)}</div></div></section>}

    <section className="v2-faith-detail-standard"><div className="v2-shell"><div><span>Religious review</span><strong>Verified before publication</strong></div><div><span>Source discipline</span><strong>Stored citations shown when available</strong></div><div><span>Authority boundary</span><strong>Amaana is not presented as a scholarly authority</strong></div></div></section>

    <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Reflection into service</p><h2>Carry the value into action.</h2><p>Return to the reviewed library or see the real initiatives where Amaana&apos;s values are put into practice.</p><div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/faith-and-reflections">Back to the library</Link>{item.initiative ? <Link className="v2-text-link" href={`/our-work/${item.initiative.slug}`}>Related initiative →</Link> : <Link className="v2-text-link" href="/our-work">Explore our work →</Link>}</div></div></section>
  </div>;
}
