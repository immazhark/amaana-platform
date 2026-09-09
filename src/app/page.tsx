import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const appeals = await prisma.appeal.findMany({ where: { status: { in: ["PUBLISHED", "FUNDED"] } }, orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }], take: 3 });
  return <>
    <section className="hero"><div className="container hero-layout">
      <div><p className="eyebrow">Compassion with accountability</p><h1>Give hope where it is needed most.</h1><p className="lead">Amaana Foundation carefully reviews requests, verifies supporting information, and connects genuine needs with people ready to help.</p><div className="actions"><Link className="button" href="/appeals">Support an appeal</Link><Link className="button secondary" href="/request-assistance">Request assistance</Link></div></div>
      <aside className="trust-panel"><p className="eyebrow" style={{color: "#f2c76f"}}>Our verification approach</p><h2>Carefully reviewed. Respectfully shared.</h2><ol><li>We receive the request and supporting documents.</li><li>Our team personally reviews and verifies the case.</li><li>Approved cases are published with consent and dignity.</li></ol></aside>
    </div></section>
    <section className="section"><div className="container"><div className="grid stats"><div className="card stat"><strong>710</strong><span>people supported through Eid Kits 2026</span></div><div className="card stat"><strong>350+</strong><span>families reached through Meat Distribution 2026</span></div><div className="card stat"><strong>Personal</strong><span>review of supporting proofs before publication</span></div></div></div></section>
    <section className="section" style={{paddingTop: 0}}><div className="container"><div className="section-heading"><div><p className="eyebrow">Current needs</p><h2>Featured appeals</h2></div><Link href="/appeals">View all appeals →</Link></div>{appeals.length ? <div className="grid appeal-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div> : <div className="card"><h3>New verified appeals are coming soon.</h3><p className="muted">Amaana’s team publishes a case only after review and approval.</p></div>}</div></section>
    <section className="section" id="how-it-works" style={{background: "#edf5f1"}}><div className="container"><p className="eyebrow">A responsible process</p><h2>How assistance works</h2><div className="grid process-grid"><div className="card"><span className="step-number">1</span><h3>Tell us the need</h3><p>Submit accurate details and a way for our verification team to contact you.</p></div><div className="card"><span className="step-number">2</span><h3>Verification</h3><p>We request relevant proofs and independently review the circumstances.</p></div><div className="card"><span className="step-number">3</span><h3>Decision and support</h3><p>Verified cases may receive direct support or become a public appeal with consent.</p></div></div></div></section>
    <section className="section" id="about"><div className="container"><p className="eyebrow">About Amaana</p><h2>Local action, lasting dignity.</h2><p className="lead">We are a Hyderabad-based charitable foundation supporting people facing medical, educational, livelihood, food and emergency hardship. We currently accept domestic donations only.</p></div></section>
  </>;
}
