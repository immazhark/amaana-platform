import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appeals, formatINR } from "@/lib/appeals";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return appeals.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const appeal = appeals.find(item => item.slug === slug); return appeal ? { title: appeal.title, description: appeal.summary } : {}; }

export default async function AppealDetailPage({ params }: Props) {
  const { slug } = await params; const appeal = appeals.find(item => item.slug === slug); if (!appeal) notFound();
  const progress = Math.min(100, Math.round((appeal.raised / appeal.goal) * 100));
  return <><section className="page-hero"><div className="container"><span className="tag">{appeal.category}</span><h1 style={{marginTop: "1rem"}}>{appeal.title}</h1><p className="lead">{appeal.summary}</p></div></section><section className="section"><div className="container detail-layout"><article><p className="eyebrow">The need</p><h2>A verified request for support</h2><p>This Foundation V1 page establishes the public appeal structure. Before a real appeal is published, Amaana’s team will add the verified case narrative, supporting context and updates approved for public sharing.</p><h3>How funds will help</h3><p>Contributions are intended for the verified purpose described in the final case record. Updates will be published as the case progresses.</p><h3>Privacy and dignity</h3><p>Only information necessary to explain and verify the need will be shared, and sensitive documents will not be made public.</p></article><aside className="card donation-panel"><p className="eyebrow">Appeal progress</p><h2>{formatINR(appeal.raised)}</h2><p>raised of {formatINR(appeal.goal)}</p><div className="progress" aria-label={`${progress}% funded`}><span style={{width: `${progress}%`}} /></div><p className="muted">{progress}% funded</p><button className="button" type="button" style={{width: "100%"}}>Donate to this appeal</button><p className="muted" style={{fontSize: ".85rem", marginTop: "1rem"}}>Domestic donations only. Payment processing will be enabled in a later release.</p></aside></div></section></>;
}
