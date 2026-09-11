import Link from "next/link";
import { getPublishedFaithContent } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Faith & Reflections",
  description: "Reviewed Islamic articles, reminders and videos that connect faith, compassion and service.",
};

export default async function FaithAndReflectionsPage() {
  const content = await getPublishedFaithContent();
  const topics = Array.from(
    new Map(
      content.flatMap(item => item.topics.map(link => [link.topic.slug, link.topic.name] as const)),
    ).entries(),
  );
  const articles = content.filter(item => item.type === "ARTICLE");
  const reminders = content.filter(item => item.type === "REMINDER");
  const videos = content.filter(item => item.type === "VIDEO");

  return (
    <div className="v2-home">
      <section className="v2-section dark v2-faith">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Faith & Reflections</p>
            <h1 className="v2-display" style={{ maxWidth: "8ch" }}>A place for the heart to return.</h1>
            <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
              A reviewed library of Islamic articles, reminders and videos centred on compassion, generosity, gratitude, service and the values that inspire Amaana&apos;s work.
            </p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Editorial standard</span>
            <blockquote>Beneficial reminders deserve the same care as every other trust.</blockquote>
            <p>Qur&apos;an citations, translations, hadith references and religious claims are kept out of the public library until their review state is verified. Amaana shares beneficial content without presenting itself as a scholarly authority.</p>
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
            <p className="v2-section-intro">
              {content.length > 0
                ? `${content.length} verified item${content.length === 1 ? "" : "s"} currently published across articles, reminders and videos.`
                : "No religious content is currently published. Drafts and unverified material remain private until review is complete."}
            </p>
          </div>

          <div className="v2-work-grid">
            <article className="v2-work-card">
              <small>Articles</small>
              <div><span className="v2-metric">{articles.length}</span><p>verified long-form items</p><h3>Articles</h3><p>Thoughtful reading with source and religious-review metadata built into the publishing workflow.</p></div>
            </article>
            <article className="v2-work-card">
              <small>Short form</small>
              <div><span className="v2-metric">{reminders.length}</span><p>verified reminders</p><h3>Islamic Reminders</h3><p>Concise reminders designed for reflection rather than engagement bait.</p></div>
            </article>
            <article className="v2-work-card">
              <small>Watch</small>
              <div><span className="v2-metric">{videos.length}</span><p>verified video items</p><h3>Videos</h3><p>A home for approved video content with attribution, context and links to related initiatives when available.</p></div>
            </article>
          </div>
        </div>
      </section>

      {content.length > 0 && (
        <section className="v2-section">
          <div className="v2-shell">
            <div className="v2-section-head">
              <div><p className="v2-section-label">Published library</p><h2 className="v2-section-title">Verified before it reaches you.</h2></div>
              <p className="v2-section-intro">Only records with both public publication status and verified religious review reach this page.</p>
            </div>
            <div className="v2-work-grid">
              {content.map(item => (
                <article className="v2-work-card" key={item.id}>
                  <small>{item.type.toLowerCase()}</small>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    {item.sourceCitation && <p><strong>Source:</strong> {item.sourceCitation}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Topics</p><h2 className="v2-section-title">A library that can grow naturally.</h2></div>
            <p className="v2-section-intro">Topics are generated from the published editorial taxonomy rather than being hard-coded into navigation.</p>
          </div>
          {topics.length > 0 ? (
            <div className="actions">{topics.map(([slug, name]) => <span className="tag" key={slug}>{name}</span>)}</div>
          ) : (
            <p className="v2-section-intro">Topic links will appear when reviewed Faith content is published.</p>
          )}
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Connected to service</p>
          <h2>Reflection should lead to good.</h2>
          <p>Where appropriate, reviewed content can connect naturally to real Amaana initiatives so visitors can understand both the value and the action it inspires.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore our work</Link>
            <Link className="v2-text-link" href="/about">Our story →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
