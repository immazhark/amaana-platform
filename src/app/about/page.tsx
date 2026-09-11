import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how a family-led Ramadan effort in Hyderabad grew into Amaana Foundation and its continuing work of faith-inspired, dignified service.",
};

export default function AboutPage() {
  return (
    <div className="v2-home about-page">
      <section className="v2-hero about-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Our story · Hyderabad</p>
            <h1 className="v2-display">A small act of care became an amanah to continue.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">Amaana began during Ramadan 2020, when a family response to a difficult time grew through the generosity of relatives, friends and the wider community.</p>
            <div className="v2-hero-proof about-proof" style={{ marginTop: "2.5rem" }}>
              <div><span className="v2-proof-number">2020</span><span className="v2-proof-copy">the year the grassroots Ramadan effort began</span></div>
              <div><span className="v2-proof-number">85</span><span className="v2-proof-copy">families reached through the first Eid Kits distribution</span></div>
              <div><span className="v2-proof-number">710</span><span className="v2-proof-copy">Eid Gift Kits distributed in 2026</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-origin v2-section about-origin">
        <div className="v2-shell">
          <p className="v2-section-label">Where Amaana began</p>
          <h2>Ramadan. A difficult year. A decision to help.</h2>
          <p>In 2020, the hardship created by the pandemic was being felt across Hyderabad. During Ramadan, the family behind Amaana wanted less-fortunate households to be able to prepare for Eid with greater ease and dignity. What began as a family-funded effort was shared with relatives and friends, and the response enabled the first Eid Kits distribution to reach 85 families.</p>
        </div>
      </section>

      <section className="about-storyline" aria-label="Amaana story timeline">
        <div className="v2-shell about-storyline-grid">
          <article className="about-story-moment">
            <span className="about-story-year">2020</span>
            <p className="v2-section-label">The beginning</p>
            <h2>85 families. One Ramadan. A reason to return the next year.</h2>
            <p>The first distribution was not treated as a one-off moment. It became the beginning of a recurring commitment to serve carefully and with dignity.</p>
          </article>
          <div className="about-thread" aria-hidden="true"><span /></div>
          <article className="about-story-moment">
            <span className="about-story-year">Then</span>
            <p className="v2-section-label">Continuity</p>
            <h2>The circle of care widened.</h2>
            <p>Eid Kits continued while seasonal relief, education, emergency response, medical and financial assistance, dates distribution and Qurbani meat distribution became part of the work.</p>
          </article>
          <div className="about-thread" aria-hidden="true"><span /></div>
          <article className="about-story-moment">
            <span className="about-story-year">2026</span>
            <p className="v2-section-label">Still growing</p>
            <h2>710 Eid Gift Kits carried the same original intention forward.</h2>
            <p>The scale changed. The responsibility did too. The aim remains practical service, clear evidence and dignity before publicity.</p>
          </article>
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">From one Ramadan onward</p><h2 className="v2-section-title">The work kept growing because people kept trusting it.</h2></div>
            <p className="v2-section-intro">As the responsibility grew, the effort was formalised as Amaana Foundation so the work could continue with clearer accountability and structure.</p>
          </div>
          <div className="v2-journey">
            <div className="v2-journey-step"><b>Compassion</b><span>A need was seen within the community.</span></div>
            <div className="v2-journey-step"><b>Family action</b><span>The first response began personally and locally.</span></div>
            <div className="v2-journey-step"><b>Community support</b><span>Friends, relatives and donors helped the effort reach further.</span></div>
            <div className="v2-journey-step"><b>Continuity</b><span>The work returned year after year instead of ending with one campaign.</span></div>
            <div className="v2-journey-step"><b>Accountability</b><span>Growth brought a greater responsibility to document, verify and serve carefully.</span></div>
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">What guides the work</p><h2 className="v2-section-title">Faith. Dignity. Action.</h2></div>
            <p className="v2-section-intro">Islamic faith is part of Amaana&apos;s origin and motivation. Service should protect dignity, generosity should be handled as a trust, and public communication should never exaggerate an outcome or expose private hardship for effect.</p>
          </div>
          <div className="v2-work-grid">
            <article className="v2-work-card"><small>Faith</small><div><h3>Service with intention</h3><p>Faith inspires compassion, generosity, gratitude and responsibility toward people in need.</p></div></article>
            <article className="v2-work-card"><small>Dignity</small><div><h3>People before publicity</h3><p>Beneficiary privacy and dignity take priority over dramatic storytelling or fundraising imagery.</p></div></article>
            <article className="v2-work-card"><small>Action</small><div><h3>Care made practical</h3><p>Amaana focuses on practical support: preparing, procuring, distributing, facilitating and following through.</p></div></article>
            <article className="v2-work-card"><small>Accountability</small><div><h3>Claims need evidence</h3><p>Figures, stories and outcomes should trace back to documented work, with uncertainty stated rather than filled in.</p></div></article>
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">How Amaana works today</p>
            <h2 className="v2-section-title">Personal care, supported by stronger systems.</h2>
            <p className="v2-section-intro">Requests are received, relevant supporting information is reviewed, genuine needs are assessed, and approved work may become an assistance case, initiative or public appeal. Internal software roles and approval mechanics stay behind the scenes; visitors should see the mission, the process and the evidence.</p>
            <div className="v2-hero-actions"><Link className="v2-button" href="/how-we-verify">How Amaana works</Link><Link className="v2-text-link" href="/transparency">Transparency →</Link></div>
          </div>
          <div className="v2-reminder v2-light-reminder">
            <span className="v2-reminder-label">Verified governance</span>
            <h3 style={{ marginTop: "1rem" }}>Legal governance has its own public record.</h3>
            <p>Amaana&apos;s registered trustees and registration facts are presented separately from internal website administration. Private source details remain protected.</p>
            <Link className="v2-text-link" href="/governance">See governance →</Link>
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">The story continues through the work</p>
          <h2>See what the amanah became.</h2>
          <p>The clearest way to understand Amaana is through the initiatives, evidence and stories that followed that first Ramadan effort.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/impact">See the impact →</Link></div>
        </div>
      </section>
    </div>
  );
}
