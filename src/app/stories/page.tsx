import Link from "next/link";

export const metadata = {
  title: "Stories",
  description: "Stories of Amanah: dignified accounts of Amaana Foundation's completed assistance and community work.",
};

export default function StoriesPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Stories of Amanah</p>
          <h1 className="v2-display" style={{ maxWidth: "9ch" }}>Every act of support has a human story.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            This space will bring together completed assistance stories, field notes and campaign moments with dignity, verified facts and only the outcomes Amaana actually knows.
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
            <p className="v2-section-intro">Medical, livelihood, seasonal, education and emergency stories will appear here only after privacy and publication review.</p>
          </div>
          <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8" }}>
            <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>Archive ingestion in progress</span>
            <h3 style={{ marginTop: "1rem" }}>Real Amaana stories will replace generic content.</h3>
            <p style={{ color: "#68717a" }}>The canonical media and document archive is being mapped so each public story can carry its source, date, approved media, known outcome and privacy status.</p>
            <Link className="v2-text-link" href="/our-work">Explore our work →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
