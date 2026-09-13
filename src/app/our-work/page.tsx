import type { Metadata } from "next";
import Link from "next/link";
import { PublicMedia } from "@/components/public-media";
import { getOurWorkIndexData } from "@/lib/public-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Explore Amaana Foundation initiatives across food support, education, seasonal relief, emergency response, medical assistance and livelihoods.",
  alternates: { canonical: "/our-work" },
  openGraph: {
    type: "website",
    url: "/our-work",
    title: "Our Work | Amaana Foundation",
    description: "Explore documented Amaana Foundation initiatives and the evidence, stories and approved media connected to them.",
  },
};

export default async function OurWorkPage() {
  const causes = await getOurWorkIndexData();
  const initiatives = causes.flatMap(cause => cause.initiatives.map(initiative => ({ ...initiative, causeTitle: cause.title })));
  const initiativeCount = initiatives.length;
  const featured = initiatives.find(initiative => initiative.isFeatured && initiative.mediaAssets.length > 0) ?? initiatives.find(initiative => initiative.mediaAssets.length > 0) ?? initiatives[0];
  const featuredMedia = featured?.mediaAssets[0] ?? null;

  return (
    <div className="v2-home v2-work-index">
      <section className="v2-hero v2-work-index-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Our Work · Hyderabad</p>
            <h1 className="v2-display">Different needs. One amanah to serve.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">Explore food distributions, education support and community assistance. Open a drive to see its photographs, campaign updates and the work behind it.</p>
            <div className="v2-work-index-proof">
              <div><span className="v2-proof-number">{initiativeCount}</span><span className="v2-proof-copy">published initiatives currently available</span></div>
              <div><span className="v2-proof-number">{causes.length}</span><span className="v2-proof-copy">cause areas represented in the public library</span></div>
            </div>
          </div>
        </div>
      </section>

      {featured && (
        <section className="v2-section v2-work-featured">
          <div className="v2-shell v2-work-featured-stage">
            <div className="v2-work-featured-copy">
              <p className="v2-section-label">Begin with one story</p>
              <p className="v2-work-featured-cause">{featured.causeTitle}</p>
              <h2>{featured.title}</h2>
              <p className="v2-work-featured-summary">{featured.summary}</p>
              <div className="v2-work-featured-evidence">
                {featured.primaryMetric && <strong className="v2-work-featured-metric">{featured.primaryMetric}</strong>}
                {featured.primaryMetricLabel && <span className="v2-work-featured-label">{featured.primaryMetricLabel}</span>}
              </div>
              <Link className="v2-button" href={`/our-work/${featured.slug}`}>Explore this initiative</Link>
            </div>

            <div className="v2-work-featured-visual" aria-label={`${featured.title} documentary record`}>
              {featuredMedia ? (
                <PublicMedia asset={featuredMedia} priority />
              ) : (
                <div className="v2-work-featured-placeholder">
                  <span>Documented initiative</span>
                  <strong>{featured.primaryMetric ?? "Amaana Foundation"}</strong>
                  <p>{featured.primaryMetricLabel ?? "Explore the initiative story, documented figures and public updates."}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Explore by need</p><h2 className="v2-section-title">A living portfolio of service.</h2></div>
            <p className="v2-section-intro">Each cause area opens into its own set of published initiatives, evidence and stories. Browse by the need first, then follow the work as deeply as you choose.</p>
          </div>

          {causes.length > 0 ? (
            <div className="v2-cause-stack">
              {causes.map((cause, causeIndex) => (
                <section className="v2-cause-section" key={cause.id} aria-labelledby={`cause-${cause.slug}`}>
                  <div className="v2-cause-heading">
                    <span className="v2-cause-number">{String(causeIndex + 1).padStart(2, "0")}</span>
                    <div><p className="v2-section-label">Cause</p><h2 id={`cause-${cause.slug}`}>{cause.title}</h2></div>
                    <p>{cause.summary}</p>
                  </div>

                  {cause.initiatives.length > 0 ? (
                    <div className="v2-initiative-list">
                      {cause.initiatives.map((initiative, index) => {
                        const thumbnail = initiative.mediaAssets[0] ?? null;
                        return (
                          <Link id={initiative.slug} className={`v2-initiative-row${thumbnail ? " has-media" : ""}`} href={`/our-work/${initiative.slug}`} key={initiative.id}>
                            <span className="v2-initiative-index">{String(index + 1).padStart(2, "0")}</span>
                            {thumbnail && <div className="v2-initiative-thumb"><PublicMedia asset={thumbnail} /></div>}
                            <div className="v2-initiative-copy">
                              <small>{initiative.year ?? (initiative.startYear && initiative.endYear ? `${initiative.startYear}–${initiative.endYear}` : "Initiative")}</small>
                              <h3>{initiative.title}</h3>
                              <p>{initiative.summary}</p>
                            </div>
                            <div className="v2-initiative-proof">
                              {initiative.primaryMetric && <strong>{initiative.primaryMetric}</strong>}
                              {initiative.primaryMetricLabel && <span>{initiative.primaryMetricLabel}</span>}
                            </div>
                            <span className="v2-initiative-arrow" aria-hidden="true">↗</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : <p className="v2-section-intro">No public initiative is currently listed in this cause area.</p>}
                </section>
              ))}
            </div>
          ) : (
            <div className="v2-reminder v2-light-reminder"><span className="v2-reminder-label">Our work</span><h3>Explore Amaana&apos;s documented initiatives.</h3><p>Initiative stories and evidence will appear here as public records are available.</p></div>
          )}
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell v2-faith-grid">
          <div><p className="v2-section-label">See the evidence</p><h2 className="v2-section-title">The work does not end at the initiative page.</h2><p className="v2-section-intro">Impact, stories, public-safe media and transparency records continue the journey so visitors can understand what happened after support was given.</p></div>
          <div className="v2-reminder"><span className="v2-reminder-label">Follow the trail</span><blockquote>Work → evidence → story → known outcome.</blockquote><div className="v2-hero-actions"><Link className="v2-button ghost" href="/impact">Explore impact</Link><Link className="v2-text-link" href="/stories">Read stories →</Link></div></div>
        </div>
      </section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Take the next step</p><h2>Understand first. Then decide how to stand with the work.</h2><p>Explore completed work, read the stories behind it, or see whether a verified public appeal is currently active.</p><div className="v2-hero-actions v2-actions-centered"><Link className="v2-button" href="/appeals">Support a verified need</Link><Link className="v2-text-link" href="/get-involved">Other ways to get involved →</Link></div></div></section>
    </div>
  );
}
