import "./home-showcase.css";
import "./campaign-home.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { getHomepagePublicContent } from "@/lib/public-content";
import { eidGrowth, foundingStory, homepageImpact } from "@/content/amaana";
import { getOurWorkIndexData } from "@/lib/public-page-data";
import { PublicMedia } from "@/components/public-media";
import { programmeCategories } from '@/lib/master-copy';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad" },
  description: "Amaana Foundation is a Hyderabad-based registered charitable trust supporting verified needs through Eid Gift Kits, Taleem, Qurbani, seasonal relief, emergency response and medical or financial assistance.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad",
    description: "A Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaana Foundation | Verified Relief, Education & Community Support in Hyderabad",
    description: "A Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance.",
  },
};

export default async function HomePage() {
  const [{ appeals }, causes] = await Promise.all([getHomepagePublicContent(), getOurWorkIndexData()]);
  const featured = causes.flatMap(cause => cause.initiatives.map(item => ({ ...item, causeTitle: cause.title })));
  const fieldDrives = featured.filter(item => ["qurbani-meat-distribution-2026", "dates-distribution-2026"].includes(item.slug));
  const heroDrive = fieldDrives.find(item => item.slug === "qurbani-meat-distribution-2026");
  const heroMedia = heroDrive?.mediaAssets[0];

  return (
    <div className="v3-home">
      <section className="v3-hero" aria-labelledby="amaana-home-title">
        <div className="v3-shell v3-hero-grid">
          <div className="v3-hero-copy">
            <p className="v3-kicker">Amaana Foundation · Hyderabad</p>
            <h1 className="v3-title" id="amaana-home-title">Trust, Turned Into Action.</h1>
            <p className="v3-lead">
              Amaana Foundation is a Hyderabad-based charitable trust helping families through verified medical and financial assistance, education support, Ramadan and Eid initiatives, seasonal relief and emergency response. We believe every contribution is an amaana—a trust to be handled with dignity, transparency and responsibility.
            </p>
            <div className="v3-actions">
              <Link className="v3-btn" href="/our-work">Explore our work</Link>
              <Link className="v3-btn secondary" href="/donate">Support a Verified Need</Link>
            </div>
          </div>

          {heroDrive && heroMedia && <div className="v3-hero-media" aria-label={heroDrive.title}>
            <div className="v3-hero-photo"><PublicMedia asset={heroMedia} priority /></div>
            <div className="v3-hero-media-shade" aria-hidden="true" />
            <div className="v3-hero-media-caption"><span>{heroDrive.year}</span><strong>{heroDrive.title}</strong><Link href={`/our-work/${heroDrive.slug}`}>See the drive</Link></div>
          </div>}
        </div>
      </section>

      <section className="v3-proof" aria-label="Selected documented impact">
        <div className="v3-shell v3-proof-grid">
          {homepageImpact.map(item => (
            <div className="v3-proof-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v3-section v3-field" aria-labelledby="field-title">
        <div className="v3-shell">
          <div className="v3-section-head">
            <div>
              <p className="v3-label">Seen in the work</p>
              <h2 className="v3-heading" id="field-title">Impact We Can Stand Behind</h2>
            </div>
            <p className="v3-intro">We would rather show programme-level evidence than publish one oversized number that cannot be responsibly audited. Our impact reporting focuses on documented annual reach, quantities distributed, verified cases completed and what donor support enabled.</p>
          </div>

          <div className="v3-field-grid">
            {fieldDrives.map((drive, index) => (
              <Link className={`v3-field-card ${index === 0 ? "v3-field-card-wide" : "v3-field-card-tall"}`} href={`/our-work/${drive.slug}`} key={drive.id}>
                {drive.mediaAssets[0] && <div className="v3-field-image"><PublicMedia asset={drive.mediaAssets[0]} /></div>}
                <div className="v3-field-copy"><span>{drive.year}</span><h3>{drive.title}</h3><p>{drive.summary}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v3-section v3-eid" aria-labelledby="eid-title">
        <div className="v3-shell v3-eid-grid">
          <div className="v3-eid-copy">
            <p className="v3-label">Our recurring commitment</p>
            <h2 className="v3-heading" id="eid-title">Eid Gift Kits — Celebrating Eid With Dignity</h2>
            <p>From 85 families in 2020 to 710 in 2026 — a growing annual commitment to dignified Eid support.</p>
            <Link className="v3-text" href="/our-work/eid-gift-kits">Explore Eid Gift Kits →</Link>
          </div>
          <div className="v3-eid-years" aria-label="Eid Gift Kits family distributions by year">
            {eidGrowth.map(item => <div key={item.year}><span>{item.year}</span><strong>{item.families}</strong><small>family distributions</small></div>)}
          </div>
        </div>
      </section>

      <section className="v3-section v3-work" aria-labelledby="work-title">
        <div className="v3-shell">
          <div className="v3-section-head"><div><p className="v3-label">Our work</p><h2 className="v3-heading" id="work-title">Practical Support, Carefully Verified.</h2></div><p className="v3-intro">Five clear areas of work help visitors understand where Amaana responds, without blurring very different kinds of support into one number.</p></div>
          <div className="v3-work-grid">{programmeCategories.map((category, index) => <Link href={`/our-work#${category.slug}`} className="v3-work-card" key={category.slug}><span>{String(index + 1).padStart(2, "0")}</span><h3>{category.title}</h3><p>{category.summary}</p><small>{category.cta} →</small></Link>)}</div>
        </div>
      </section>

      <section className="v3-section v3-story" aria-labelledby="story-title"><div className="v3-shell v3-story-grid"><div><p className="v3-label">Our story</p><h2 className="v3-heading" id="story-title">From a Ramadan Response to a Registered Trust.</h2></div><div><p>{foundingStory}</p><Link className="v3-text" href="/about">Read our story →</Link></div></div></section>

      <section className="v3-section v3-appeals" aria-labelledby="appeals-title"><div className="v3-shell"><div className="v3-section-head"><div><p className="v3-label">Current appeals</p><h2 className="v3-heading" id="appeals-title">Verified Needs. Clear Purpose.</h2></div><Link className="v3-text" href="/appeals">View all appeals →</Link></div>{appeals.length > 0 ? <div className="appeal-grid">{appeals.map(appeal => <AppealCard appeal={appeal} key={appeal.slug} />)}</div> : <div className="v3-empty"><h3>No Public Appeal Is Open Right Now</h3><p>Completed support remains documented, and new public appeals are opened only after verification and approval.</p><Link className="v3-btn" href="/our-work">Explore completed work</Link></div>}</div></section>
    </div>
  );
}
