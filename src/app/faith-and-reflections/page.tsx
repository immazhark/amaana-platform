import Link from "next/link";

export const metadata = {
  title: "Faith & Reflections",
  description: "Islamic articles, reminders and videos that connect faith, compassion and service.",
};

const topics = [
  "Qur'an",
  "Hadith",
  "Sadaqah",
  "Zakat",
  "Ramadan",
  "Qurbani",
  "Compassion",
  "Gratitude",
  "Patience",
  "Helping Others",
  "Caring for Orphans",
  "Service",
];

export default function FaithAndReflectionsPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark v2-faith">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Faith & Reflections</p>
            <h1 className="v2-display" style={{ maxWidth: "8ch" }}>A place for the heart to return.</h1>
            <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
              A growing library of Islamic articles, reminders and videos centred on compassion, generosity, gratitude, service and the values that inspire Amaana's work.
            </p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Editorial standard</span>
            <blockquote>Beneficial reminders deserve the same care as every other trust.</blockquote>
            <p>Qur'an citations, translations, hadith references and religious claims will be verified before publication. Amaana will share beneficial content without presenting itself as a scholarly authority.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Explore</p>
              <h2 className="v2-section-title">Read. Reflect. Watch.</h2>
            </div>
            <p className="v2-section-intro">The publishing system will support three first-class content types so short reminders do not get buried inside long articles, and videos remain easy to discover.</p>
          </div>

          <div className="v2-work-grid">
            <article className="v2-work-card">
              <small>Articles</small>
              <div>
                <span className="v2-metric">01</span>
                <p>Long-form learning and reflection</p>
                <h3>Articles</h3>
                <p>Thoughtful reading on Islamic values, giving, compassion, Ramadan, Qurbani and service, with sources and review status built into the publishing workflow.</p>
              </div>
            </article>
            <article className="v2-work-card">
              <small>Short form</small>
              <div>
                <span className="v2-metric">02</span>
                <p>Small moments of reflection</p>
                <h3>Islamic Reminders</h3>
                <p>Concise, shareable reminders for the homepage and dedicated library — designed for reflection rather than engagement bait.</p>
              </div>
            </article>
            <article className="v2-work-card">
              <small>Watch</small>
              <div>
                <span className="v2-metric">03</span>
                <p>Video reminders and learning</p>
                <h3>Videos</h3>
                <p>A home for Amaana-produced or approved video content with clear attribution, context and links to related articles or initiatives.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Topics</p>
              <h2 className="v2-section-title">A library that can grow naturally.</h2>
            </div>
            <p className="v2-section-intro">Topics will be taxonomy, not hard-coded navigation. New subjects can be added as the editorial library expands.</p>
          </div>
          <div className="actions">
            {topics.map(topic => <span className="tag" key={topic}>{topic}</span>)}
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Connected to service</p>
          <h2>Reflection should lead to good.</h2>
          <p>Where appropriate, articles and reminders will connect naturally to real Amaana initiatives so visitors can understand both the value and the action it inspires.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore our work</Link>
            <Link className="v2-text-link" href="/about">Our story →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
