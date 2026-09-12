import "./home-experience.css";
import "./home-wow.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { PublicMedia } from "@/components/public-media";
import { getHomepagePublicContent } from "@/lib/public-content";
import { getHomepageHeroMedia } from "@/lib/public-page-data";
import { eidGrowth, foundingStory, homepageImpact, initiatives as documentedInitiatives } from "@/content/amaana";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amaana Foundation",
  description: "Faith-inspired service, dignified assistance and transparent community action from Amaana Foundation in Hyderabad.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Amaana Foundation",
    description: "Faith-inspired service, dignified assistance and transparent community action from Hyderabad, India.",
  },
};

const visitorActions = [
  { title: "See the work", copy: "Explore documented initiatives, distributions and the people-centred stories behind the numbers.", href: "/our-work", marker: "01" },
  { title: "Support a verified need", copy: "See whether Amaana currently has a reviewed public appeal open for support.", href: "/appeals", marker: "02" },
  { title: "Request assistance", copy: "Share a genuine need privately through Amaana's assistance intake process.", href: "/request-assistance", marker: "03" },
  { title: "Give time or skills", copy: "Discover ways to stand with the work beyond a financial contribution.", href: "/get-involved", marker: "04" },
] as const;

export default async function HomePage() {
  const [{ appeals, initiatives, featuredFaith, stories }, heroMedia] = await Promise.all([
    getHomepagePublicContent(),
    getHomepageHeroMedia(),
  ]);

  const heroContext = heroMedia?.initiative
    ? { label: "Documented initiative", title: heroMedia.initiative.title, href: `/our-work/${heroMedia.initiative.slug}` }
    : heroMedia?.story
      ? { label: "Story of Amanah", title: heroMedia.story.title, href: `/stories/${heroMedia.story.slug}` }
      : null;

  return (
    <div className="v2-home">
      <section className="v2-hero v2-home-hero">
        <div className="v2-shell v2-home-hero-grid">
          <div className="v2-home-hero-copy">
            <p className="v2-kicker">Amaana Foundation · Hyderabad</p>
            <h1 className="v2-display">Faith. Dignity. Action.</h1>
            <p className="v2-hero-copy">What began as a family-led Ramadan effort in 2020 has grown into years of community-supported service — carrying care from hearts to homes with dignity, transparency and dua.</p>
            <div className="v2-hero-actions">
              <Link className="v2-button" href="/our-work">Explore our work</Link>
              <Link className="v2-button ghost" href="/about">Our story</Link>
            </div>
            <div className="v2-home-hero-proof">
              <div><span className="v2-proof-number">710</span><span className="v2-proof-copy">Eid Gift Kits distributed in 2026</span></div>
              <div><span className="v2-proof-number">7</span><span className="v2-proof-copy">consecutive years of Eid Kits, from 2020 through 2026</span></div>
            </div>
          </div>

          <div className="v2-home-hero-visual" aria-label="Amaana Foundation documented work">
            {heroMedia ? (
              <>
                <PublicMedia asset={heroMedia} priority />
                {heroContext && <Link className="v2-home-hero-context" href={heroContext.href}><span>{heroContext.label}</span><span>{heroContext.title} →</span></Link>}
              </>
            ) : (
              <figure className="v2-documentary-fallback">
                <Image src="/media/qurbani-meat-distribution-2026.jpg" alt="Amaana Foundation Qurbani Meat Distribution 2026 boxes prepared for distribution" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
                <figcaption className="v2-documentary-caption">
                  <span><small>Documented work · 2026</small><strong>Qurbani boxes prepared for dignified distribution.</strong></span>
                  <Link className="v2-text-link" href="/our-work#qurbani-meat-distribution">See the initiative →</Link>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <section className="v2-intent" aria-labelledby="visitor-intent-title">
        <div className="v2-shell">
          <div className="v2-intent-heading">
            <p className="v2-section-label">Start where you are</p>
            <h2 id="visitor-intent-title">What brings you to Amaana today?</h2>
            <p>Explore first. Understand the work. Take the next step that is right for you.</p>
          </div>
          <div className="v2-intent-grid">
            {visitorActions.map(action => (
              <Link className="v2-intent-card" href={action.href} key={action.href}>
                <span className="v2-intent-marker" aria-hidden="true">{action.marker}</span>
                <div><h3>{action.title}</h3><p>{action.copy}</p></div>
                <span className="v2-intent-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-origin v2-section">
        <div className="v2-shell"><p className="v2-section-label">{foundingStory.eyebrow}</p><h2>{foundingStory.headline}</h2><p>{foundingStory.body}</p></div>
      </section>

      <section className="v2-documentary-strip" aria-labelledby="documentary-work-title">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Seen in the work</p><h2 className="v2-section-title" id="documentary-work-title">Amanah is something you should be able to see.</h2></div>
            <p className="v2-section-intro">Real preparation, real distributions and real campaign records. The public site is becoming a documentary record of Amaana&apos;s work, while private beneficiary proofs remain private.</p>
          </div>
          <div className="v2-documentary-grid">
            <Link className="v2-documentary-card" href="/our-work#qurbani-meat-distribution">
              <Image src="/media/qurbani-meat-distribution-2026.jpg" alt="Rows of Amaana Foundation Qurbani Meat Distribution 2026 boxes" fill sizes="(max-width: 820px) 100vw, 65vw" />
              <div className="v2-documentary-card-copy"><small>Qurbani · 2026</small><h3>350+ families reached.</h3><p>Prepared and packed for distribution across Hyderabad with dignity and care.</p></div>
            </Link>
            <Link className="v2-documentary-card secondary" href="/our-work#dates-distribution">
              <Image src="/media/dates-distribution.jpg" alt="Amaana Foundation dates distribution" fill sizes="(max-width: 820px) 100vw, 35vw" />
              <div className="v2-documentary-card-copy"><small>Ramadan giving</small><h3>162 kg of dates distributed.</h3><p>A documented community-supported Ramadan initiative.</p></div>
            </Link>
          </div>
          <div className="v2-evidence-ribbon" aria-label="Selected documented Amaana impact">
            {homepageImpact.map(item => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Our work</p><h2 className="v2-section-title">Different needs. One amanah to serve.</h2></div><div><p className="v2-section-intro">Explore Amaana&apos;s initiatives and the documented work behind them.</p><Link className="v2-text-link" href="/our-work">Explore all initiatives →</Link></div></div>
          {initiatives.length > 0 ? (
            <div className="v2-work-grid">{initiatives.map(initiative => <Link className="v2-work-card" href={`/our-work/${initiative.slug}`} key={initiative.id}><small>{initiative.cause.title}</small><div>{initiative.primaryMetric && <span className="v2-metric">{initiative.primaryMetric}</span>}{initiative.primaryMetricLabel && <p>{initiative.primaryMetricLabel}</p>}<h3>{initiative.title}</h3><p>{initiative.summary}</p></div></Link>)}</div>
          ) : (
            <div className="v2-work-grid">{documentedInitiatives.slice(0, 6).map(initiative => <Link className="v2-work-card" href={initiative.href} key={initiative.slug}><small>{initiative.eyebrow}</small><div><span className="v2-metric">{initiative.metric}</span><p>{initiative.metricLabel}</p><h3>{initiative.title}</h3><p>{initiative.summary}</p></div></Link>)}</div>
          )}
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Seven years of Eid Kits</p><h2 className="v2-section-title">From 85 families to 710 Eid Gift Kits.</h2></div><div><p className="v2-section-intro">A Ramadan effort that began around one family table became a recurring community tradition. Follow its documented growth year by year.</p><Link className="v2-text-link" href="/our-work/eid-gift-kits">Explore the seven-year story →</Link></div></div>
          <div className="v2-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">{eidGrowth.map(item => <div className="v2-year" key={item.year}><strong>{item.year}</strong><span>{item.families}</span><small>families{item.year === "2026" ? " / kits" : ""}</small></div>)}</div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Impact is not one number</p><h2 className="v2-section-title">Every figure belongs to a story.</h2></div><p className="v2-section-intro">Impact is presented alongside initiative records, photographs, updates and known outcomes — not as isolated counters.</p></div>
          <div className="v2-impact-grid">{homepageImpact.map(item => <div className="v2-impact-item" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>
          <div style={{ marginTop: "2rem" }}><Link className="v2-text-link" href="/impact">Explore impact →</Link></div>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="v2-section paper">
          <div className="v2-shell">
            <div className="v2-section-head"><div><p className="v2-section-label">From the field</p><h2 className="v2-section-title">The work keeps moving.</h2></div><div><p className="v2-section-intro">Published, privacy-approved moments from Amaana&apos;s work — a living record rather than a static brochure.</p><Link className="v2-text-link" href="/stories">All Stories of Amanah →</Link></div></div>
            <div className="v2-field-grid">{stories.map(story => <Link className="v2-field-story" href={`/stories/${story.slug}`} key={story.id}><span className="v2-field-date">{story.publishedAt ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(story.publishedAt) : "Published story"}</span><h3>{story.title}</h3><p>{story.summary}</p><span className="v2-text-link">Read the story →</span></Link>)}</div>
          </div>
        </section>
      )}

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">How Amaana works</p><h2 className="v2-section-title">Care moves through a responsible process.</h2></div><p className="v2-section-intro">Requests and campaigns move through review, verification, preparation, delivery and follow-up while protecting dignity and private documents.</p></div>
          <div className="v2-journey"><div className="v2-journey-step"><b>Need received</b><span>We understand the circumstances and requested support.</span></div><div className="v2-journey-step"><b>Review</b><span>Relevant information and supporting proofs are reviewed.</span></div><div className="v2-journey-step"><b>Decision</b><span>The team decides how the verified need can responsibly be supported.</span></div><div className="v2-journey-step"><b>Action</b><span>Support is prepared, facilitated or distributed as appropriate.</span></div><div className="v2-journey-step"><b>Update</b><span>Known outcomes are recorded without inventing what is not known.</span></div></div>
          <div style={{ marginTop: "2rem" }}><Link className="v2-text-link" href="/how-we-verify">See our approach →</Link></div>
        </div>
      </section>

      <section className="v2-section dark v2-faith"><div className="v2-shell v2-faith-grid"><div><p className="v2-section-label">Faith & Reflections</p><h2 className="v2-section-title">Faith inspires our service.</h2><p className="v2-section-intro">A growing editorial space for reviewed Islamic articles, reminders and videos on compassion, sadaqah, Ramadan, Qurbani, gratitude and service.</p><Link className="v2-button ghost" href="/faith-and-reflections">Explore Faith & Reflections</Link></div>{featuredFaith ? <div className="v2-reminder"><span className="v2-reminder-label">{featuredFaith.type.toLowerCase()}</span><blockquote>{featuredFaith.title}</blockquote><p>{featuredFaith.excerpt}</p></div> : <div className="v2-reminder"><span className="v2-reminder-label">Editorial review</span><blockquote>Faith belongs in the experience with care.</blockquote><p>Only reviewed religious material is published; meanwhile, Amaana&apos;s service, history and verified work remain fully explorable.</p></div>}</div></section>

      <section className="v2-section paper"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Current verified appeals</p><h2 className="v2-section-title">When there is a need, we share it responsibly.</h2></div><Link className="v2-text-link" href="/appeals">View appeals →</Link></div>{appeals.length ? <div className="grid appeal-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div> : <div className="v2-reminder v2-light-reminder"><span className="v2-reminder-label">No active public appeal right now</span><h3>Explore the work already carried out.</h3><p>Completed initiatives and campaign records remain available even when Amaana is not actively fundraising for a public appeal.</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/impact">See documented impact →</Link></div></div>}</div></section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Amaana Foundation</p><h2>From our hearts to their homes.</h2><p>Follow the work, understand the stories, request assistance when needed, or stand with a verified cause when one is active.</p><div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/get-involved">Get involved</Link><Link className="v2-text-link" href="/request-assistance">Request assistance →</Link></div></div></section>
    </div>
  );
}
