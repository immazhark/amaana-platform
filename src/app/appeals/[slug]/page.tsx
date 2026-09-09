import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const appeal = await prisma.appeal.findFirst({ where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } }, select: { title: true, summary: true } }); return appeal ? { title: appeal.title, description: appeal.summary } : {}; }

export default async function AppealDetailPage({ params }: Props) {
  const { slug } = await params; const appeal = await prisma.appeal.findFirst({ where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } }, include: { updates: { where: { isPublic: true }, orderBy: { publishedAt: "desc" } } } }); if (!appeal) notFound();
  const raised = appeal.amountRaised.toNumber(); const goal = appeal.goalAmount.toNumber(); const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return <><section className="page-hero"><div className="container"><span className="tag">{appeal.category.replaceAll("_", " ")}</span><h1 style={{marginTop: "1rem"}}>{appeal.title}</h1><p className="lead">{appeal.summary}</p></div></section><section className="section"><div className="container detail-layout"><article><p className="eyebrow">The need</p><h2>{appeal.beneficiaryDisplayName ?? "A verified request for support"}</h2><div className="appeal-story">{appeal.story}</div>{appeal.updates.length > 0 && <section className="appeal-updates"><h2>Updates</h2>{appeal.updates.map(update => <article className="card" key={update.id}><p className="eyebrow">{update.publishedAt?.toLocaleDateString("en-IN", { dateStyle: "long" })}</p><h3>{update.title}</h3><p>{update.content}</p></article>)}</section>}<h3>Privacy and dignity</h3><p>Only information approved for public sharing is shown. Supporting documents remain private.</p></article><aside className="card donation-panel"><p className="eyebrow">Appeal progress</p><h2>{formatINR(raised)}</h2><p>raised of {formatINR(goal)}</p><div className="progress" aria-label={`${progress}% funded`}><span style={{width: `${progress}%`}} /></div><p className="muted">{progress}% funded</p>{appeal.status === "PUBLISHED" ? <Link className="button" href={`/donate/${appeal.slug}`} style={{width: "100%"}}>Donate to this appeal</Link> : <span className="button" aria-disabled="true" style={{width: "100%", opacity: .65}}>Appeal closed</span>}<p className="muted" style={{fontSize: ".85rem", marginTop: "1rem"}}>Domestic INR donations securely processed by Razorpay.</p></aside></div></section></>;
}
