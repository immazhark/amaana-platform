import Link from "next/link";
import { getPublishedStories } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stories of Amanah",
  description: "Dignified, privacy-reviewed accounts of Amaana Foundation's completed assistance and community work.",
};

export default async function StoriesPage() {
  const stories = await getPublishedStories();

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Stories of Amanah</p>
          <h1 className="v2-display" style={{ maxWidth: "9ch" }}>Every act of support has a human story.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Completed assistance stories, field notes and campaign moments appear here only after publication and privacy review, with known outcomes kept separate from assumptions.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Editorial archive</p>
              <h2 className="v2-section-title">Circumstance. Verification. Action. Outcome.</h2>
            </div>
            <p className="v2-section-intro">Stories are public only when their record is published and a privacy approval timestamp is present.</p>
          </div>

          {stories.length > 0 ? (
            <div className="v2-work-grid">
              {stories.map(story => (
                <Link className="v2-work-card" href={`/stories/${story.slug}`} key={story.id}>
                  <small>{story.initiative?.title ?? story.cause?.title ?? "Story of Amanah"}</small>
                  <div>
                    <h3>{story.title}</h3>
                    <p>{story.summary}</p>
                    <span className="v2-text-link">Read story →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8" }}>
              <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>Privacy gate active</span>
              <h3 style={{ marginTop: "1rem" }}>No public stories are available yet.</h3>
              <p style={{ color: "#68717a" }}>A story remains private until both publication review and privacy approval are complete.</p>
              <Link className="v2-text-link" href="/our-work">Explore published initiatives →</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
