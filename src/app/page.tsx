import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { prisma } from "@/lib/prisma";
import { eidGrowth, foundingStory, homepageImpact, initiatives } from "@/content/amaana";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const appeals = await prisma.appeal.findMany({
    where: { status: { in: ["PUBLISHED", "FUNDED"] } },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
    take: 3,
  });

  return (
    <div className="v2-home">
      <section className="v2-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Amaana Foundation · Hyderabad</p>
            <h1 className="v2-display">Faith. Dignity. Action.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">
              What began as a family-led Ramadan effort in 2020 has grown into years of community-supported service — carrying care from hearts to homes with dignity, transparency and dua.
            </p>
            <div className="v2-hero-actions">
              <Link className="v2-button" href="/our-work">Explore our work</Link>
              <Link className="v2-button ghost" href="/about">Our story</Link>
            </div>
            <div className="v2-hero-proof" style={{ marginTop: "2.5rem" }}>
              <div>
                <span className="v2-proof-number">710</span>
                <span className="v2-proof-copy">Eid Gift Kits distributed in 2026</span>
              </div>
              <div>
                <span className="v2-proof-number">7</span>
                <span className="v2-proof-copy">consecutive years of Eid Kits, from 2020 through 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-origin v2-section">
        <div className="v2-shell">
          <p className="v2-section-label">{foundingStory.eyebrow}</p>
          <h2>{foundingStory.headline}</h2>
          <p>{foundingStory.body}</p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Our work</p>
              <h2 className="v2-section-title">Different needs. One amanah to serve.</h2>
            </div>
            <div>
              <p className="v2-section-intro">
                Amaana’s work has grown across seasonal giving, food support, education, emergency relief, medical assistance and livelihood needs. Each initiative carries its own story, evidence and people behind it.
              </p>
              <Link className="v2-text-link" href="/our-work">Explore all initiatives →</Link>
            </div>
          </div>

          <div className="v2-work-grid">
            {initiatives.map(initiative => (
              <Link className="v2-work-card" href={initiative.href} key={initiative.slug}>
                <small>{initiative.eyebrow}</small>
                <div>
                  <span className="v2-metric">{initiative.metric}</span>
                  <p>{initiative.metricLabel}</p>
                  <h3>{initiative.title}</h3>
                  <p>{initiative.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Seven years of Eid Kits</p>
              <h2 className="v2-section-title">From 85 families to 710 Eid Gift Kits.</h2>
            </div>
            <div>
              <p className="v2-section-intro">
                A Ramadan effort that began around one family table became a recurring community tradition. The full story will bring together every year’s photos, kit contents, financial records and distribution moments.
              </p>
              <Link className="v2-text-link" href="/our-work/eid-gift-kits">Explore the seven-year story →</Link>
            </div>
          </div>

          <div className="v2-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {eidGrowth.map(item => (
              <div className="v2-year" key={item.year}>
                <strong>{item.year}</strong>
                <span>{item.families}</span>
                <small>families{item.year === "2026" ? " / kits" : ""}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Impact is not one number</p>
              <h2 className="v2-section-title">Every figure belongs to a story.</h2>
            </div>
            <p className="v2-section-intro">
              We are rebuilding impact around evidence: initiative records, real photographs, reports, updates and known outcomes — not isolated counters.
            </p>
          </div>

          <div className="v2-impact-grid">
            {homepageImpact.map(item => (
              <div className="v2-impact-item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "2rem" }}><Link className="v2-text-link" href="/impact">Explore impact →</Link></div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">How Amaana works</p>
              <h2 className="v2-section-title">Care moves through a responsible process.</h2>
            </div>
            <p className="v2-section-intro">Requests and campaigns are handled through review, verification, preparation, delivery and follow-up while protecting dignity and private documents.</p>
          </div>
          <div className="v2-journey">
            <div className="v2-journey-step"><b>Need received</b><span>We understand the circumstances and requested support.</span></div>
            <div className="v2-journey-step"><b>Review</b><span>Relevant information and supporting proofs are reviewed.</span></div>
            <div className="v2-journey-step"><b>Decision</b><span>The team decides how the verified need can responsibly be supported.</span></div>
            <div className="v2-journey-step"><b>Action</b><span>Support is prepared, facilitated or distributed as appropriate.</span></div>
            <div className="v2-journey-step"><b>Update</b><span>Known outcomes and donor updates are recorded without inventing what is not known.</span></div>
          </div>
          <div style={{ marginTop: "2rem" }}><Link className="v2-text-link" href="/how-we-verify">See our approach →</Link></div>
        </div>
      </section>

      <section className="v2-section dark v2-faith">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Faith & Reflections</p>
            <h2 className="v2-section-title">Faith inspires our service.</h2>
            <p className="v2-section-intro">
              A growing editorial space for verified Islamic articles, reminders and videos on compassion, sadaqah, Ramadan, Qurbani, gratitude, service and the values that inspire good works.
            </p>
            <Link className="v2-button ghost" href="/faith-and-reflections">Explore Faith & Reflections</Link>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">A reminder for the heart</span>
            <blockquote>Give with sincerity. Serve with dignity. Leave the outcome to Allah.</blockquote>
            <p>This homepage space will surface a verified published reminder, article or video from the editorial library rather than hard-code religious quotations.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Current verified appeals</p>
              <h2 className="v2-section-title">When there is a need, we share it responsibly.</h2>
            </div>
            <Link className="v2-text-link" href="/appeals">View appeals →</Link>
          </div>
          {appeals.length ? (
            <div className="grid appeal-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div>
          ) : (
            <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8" }}>
              <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>No active public appeal right now</span>
              <h3 style={{ marginTop: "1rem" }}>There is still meaningful work to explore.</h3>
              <p style={{ color: "#68717a" }}>See completed initiatives and past assistance stories to understand where community support has already made a difference.</p>
              <div className="v2-hero-actions">
                <Link className="v2-button" href="/our-work">Explore our work</Link>
                <Link className="v2-text-link" href="/stories">Read stories →</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Amaana Foundation</p>
          <h2>From our hearts to their homes.</h2>
          <p>Follow the work, understand the stories, request assistance when needed, or stand with a verified cause when one is active.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/get-involved">Get involved</Link>
            <Link className="v2-text-link" href="/request-assistance">Request assistance →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
