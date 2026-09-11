import type { Metadata } from "next";
import Link from "next/link";
import { getTransparencyPageData } from "@/lib/public-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transparency",
  description: "See how Amaana Foundation connects published initiatives, evidence, updates and privacy-safe reporting.",
  alternates: { canonical: "/transparency" },
  openGraph: {
    type: "website",
    url: "/transparency",
    title: "Transparency | Amaana Foundation",
    description: "See how Amaana Foundation connects published initiatives, evidence, updates and privacy-safe reporting.",
  },
  twitter: {
    card: "summary",
    title: "Transparency | Amaana Foundation",
    description: "Follow Amaana Foundation's public evidence approach without exposing private proofs.",
  },
};

export default async function TransparencyPage() {
  const initiatives = await getTransparencyPageData();
  const withMetrics = initiatives.filter(item => item.primaryMetric && item.primaryMetricLabel);

  return <div className="v2-home v2-transparency-page">
    <section className="v2-transparency-hero"><div className="v2-shell v2-transparency-hero-grid"><div><p className="v2-section-label">Transparency · without exposure</p><h1>See what<br />your trust<br />became.</h1><p>Transparency should connect a published need or initiative to what was prepared, delivered and responsibly documented — without turning private verification material into public content.</p><div className="v2-hero-actions"><a className="v2-button" href="#evidence-chain">Follow the evidence chain</a><Link className="v2-text-link" href="/compliance">Compliance position →</Link></div></div><div className="v2-transparency-orbit"><strong>Public<br />evidence</strong><span>Need</span><span>Support</span><span>Preparation</span><span>Delivery</span><span>Outcome</span></div></div></section>

    <section className="v2-transparency-manifesto"><div className="v2-shell"><small>The rule</small><blockquote>Public evidence.<br />Private proofs.</blockquote><p>Accountability and dignity are not opposites. The public record should explain the work while keeping sensitive source documents protected.</p></div></section>

    <section className="v2-section paper" id="evidence-chain"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">The evidence chain</p><h2 className="v2-section-title">Support should leave a responsible trail.</h2></div><p className="v2-section-intro">Amaana structures public reporting around what can actually be supported by its records. If a link in the chain is not known, it is not invented.</p></div><div className="v2-transparency-chain"><article><span>01</span><div><h3>Need or initiative</h3><p>What was being addressed and why.</p></div></article><article><span>02</span><div><h3>Support received</h3><p>Contribution or campaign information where verified and appropriate to publish.</p></div></article><article><span>03</span><div><h3>Preparation</h3><p>Procurement, packing, coordination or another documented action.</p></div></article><article><span>04</span><div><h3>Delivery</h3><p>Distribution, handover or assistance actually completed.</p></div></article><article><span>05</span><div><h3>Known outcome</h3><p>Only outcomes supported by Amaana&apos;s records are stated publicly.</p></div></article></div></div></section>

    <section className="v2-section dark v2-transparency-record"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Published record</p><h2 className="v2-section-title">Follow evidence back to the work.</h2></div><p className="v2-section-intro">Each published initiative can accumulate approved figures, media, stories, related appeals and updates without making private source documents public.</p></div>{initiatives.length>0?<div className="v2-transparency-ledger">{initiatives.map((initiative,index)=><Link href={`/our-work/${initiative.slug}`} key={initiative.id}><span>{String(index+1).padStart(2,"0")}</span><div><small>{initiative.cause.title}</small><h3>{initiative.title}</h3></div><p>{initiative.summary}</p>{initiative.primaryMetric?<div className="v2-transparency-ledger-metric"><strong>{initiative.primaryMetric}</strong><small>{initiative.primaryMetricLabel}</small></div>:<b>Open record ↗</b>}</Link>)}</div>:<div className="v2-reminder"><span className="v2-reminder-label">Publication gate active</span><h3>No initiative record is published yet.</h3><p>Nothing is manufactured simply to make the page look fuller.</p></div>}</div></section>

    {withMetrics.length>0&&<section className="v2-transparency-signals"><div className="v2-shell"><p className="v2-section-label">Documented signals</p><div>{withMetrics.slice(0,4).map(item=><article key={item.id}><strong>{item.primaryMetric}</strong><span>{item.primaryMetricLabel}</span><small>{item.title}</small></article>)}</div></div></section>}

    <section className="v2-section v2-transparency-boundary"><div className="v2-shell v2-transparency-boundary-grid"><div><p className="v2-section-label">The privacy boundary</p><h2 className="v2-section-title">Transparency does not mean exposing people.</h2></div><div className="v2-transparency-do-dont"><article><span>We may publish</span><p>Approved initiative context, public-safe media, verified figures, appeal updates and known outcomes.</p></article><article><span>We keep private</span><p>Identity documents, medical records, bank information, private contact details, reviewer notes and sensitive verification material.</p></article></div></div></section>

    <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Three connected views of trust</p><h2>Verification before. Evidence during. Accountability after.</h2><p>Explore how Amaana reviews requests, what it reports publicly and the current compliance position behind its donation controls.</p><div className="v2-hero-actions" style={{justifyContent:"center"}}><Link className="v2-button" href="/how-we-verify">How we verify</Link><Link className="v2-text-link" href="/compliance">Compliance & registration →</Link></div></div></section>
  </div>;
}
