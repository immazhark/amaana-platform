import Link from "next/link";
import { getPublishedCauses } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Work",
  description: "Explore Amaana Foundation initiatives across food support, education, seasonal relief, emergency response, medical assistance and livelihoods.",
};

export default async function OurWorkPage() {
  const causes = await getPublishedCauses();
  const initiativeCount = causes.reduce((total, cause) => total + cause.initiatives.length, 0);

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Our Work</p>
          <h1 className="v2-display" style={{ maxWidth: "8ch" }}>Service that grows with the need.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Amaana&apos;s work is organised around causes, with each published initiative carrying its own story, evidence, media and related appeals as those records are approved for public use.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Published work</p>
              <h2 className="v2-section-title">A living portfolio of service.</h2>
            </div>
            <p className="v2-section-intro">
              {initiativeCount > 0
                ? `${initiativeCount} published initiative${initiativeCount === 1 ? "" : "s"} across ${causes.length} cause${causes.length === 1 ? "" : "s"}. New verified work can be added without redesigning this page.`
                : "There are no published initiatives in the public content library yet. Content remains private until it passes the publication gate."}
            </p>
          </div>

          {causes.length > 0 ? (
            <div style={{ display: "grid", gap: "5rem", marginTop: "3rem" }}>
              {causes.map(cause => (
                <section key={cause.id} aria-labelledby={`cause-${cause.slug}`}>
                  <div className="v2-section-head">
                    <div>
                      <p className="v2-section-label">Cause</p>
                      <h2 className="v2-section-title" id={`cause-${cause.slug}`}>{cause.title}</h2>
                    </div>
                    <p className="v2-section-intro">{cause.summary}</p>
                  </div>

                  {cause.initiatives.length > 0 ? (
                    <div className="v2-work-grid" style={{ marginTop: "2rem" }}>
                      {cause.initiatives.map(initiative => (
                        <Link className="v2-work-card" href={`/our-work/${initiative.slug}`} key={initiative.id}>
                          <small>
                            {initiative.year
                              ? initiative.year
                              : initiative.startYear && initiative.endYear
                                ? `${initiative.startYear}–${initiative.endYear}`
                                : "Initiative"}
                          </small>
                          <div>
                            {initiative.primaryMetric && <span className="v2-metric">{initiative.primaryMetric}</span>}
                            {initiative.primaryMetricLabel && <p>{initiative.primaryMetricLabel}</p>}
                            <h3>{initiative.title}</h3>
                            <p>{initiative.summary}</p>
                            <span className="v2-text-link">Explore initiative →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="v2-section-intro" style={{ marginTop: "2rem" }}>No initiatives from this cause are currently published.</p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8", marginTop: "2rem" }}>
              <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>Publication gate active</span>
              <h3 style={{ marginTop: "1rem" }}>Our verified initiative library is being prepared.</h3>
              <p style={{ color: "#68717a" }}>Nothing is exposed publicly merely because it exists in the database. Causes and initiatives must be explicitly published first.</p>
            </div>
          )}
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Explore further</p>
          <h2>Follow the evidence behind the work.</h2>
          <p>Impact, stories and appeals will connect back to the causes and initiatives they belong to as their records are approved for publication.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/impact">Explore impact</Link>
            <Link className="v2-text-link" href="/get-involved">Get involved →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
