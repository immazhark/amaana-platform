import Link from "next/link";
import { PublicMedia } from "@/components/public-media";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { ActionIcon } from "@/components/action-icon";
import { selectIdentityPublicImage } from "@/lib/public-media";
import { heroTeaser } from "@/lib/public-copy";
import type { getOurWorkIndexData } from "@/lib/public-page-data";

type WorkCategory = Awaited<ReturnType<typeof getOurWorkIndexData>>[number];
export function WorkPortfolio({ causes, expanded = false, yearFiltered = false }: { causes: WorkCategory[]; expanded?: boolean; yearFiltered?: boolean }) {
  return (
          <div className="v2-cause-stack v2-cause-accordion">
            {causes.map((cause, causeIndex) => (
              <details
                className="v2-cause-section v2-cause-disclosure"
                key={cause.id}
                data-work-category={cause.slug}
                open={expanded}
              >
                <summary className="v2-cause-summary">
                  <h2 className="v2-cause-summary-heading" id={`cause-${cause.slug}`}>
                    <span className="v2-cause-number" aria-hidden="true">{String(causeIndex + 1).padStart(2, "0")}</span>
                    <span className="v2-cause-summary-copy">
                      <span className="v2-section-label">Umbrella programme</span>
                      <span className="v2-cause-summary-title">{cause.title}</span>
                    </span>
                    <span className="v2-cause-summary-count">
                      {cause.initiatives.length} {cause.initiatives.length === 1 ? "initiative" : "initiatives"}
                    </span>
                    <span className="v2-cause-summary-toggle" aria-hidden="true">+</span>
                  </h2>
                </summary>

                <div className="v2-cause-panel">
                  <p className="v2-cause-description">{cause.summary}</p>
                  <div className="v2-initiative-list">
                    {cause.initiatives.map((initiative, index) => {
                      const thumbnail = selectIdentityPublicImage(initiative.mediaAssets) ?? null;
                      return (
                        <Link
                          id={initiative.slug}
                          className="v2-initiative-row has-media"
                          href={`/our-work/${initiative.slug}`}
                          key={initiative.id}
                        >
                          <span className="v2-initiative-index">{String(index + 1).padStart(2, "0")}</span>
                          <div className={`v2-initiative-thumb${thumbnail ? "" : " v2-initiative-thumb-fallback"}`}>
                            {thumbnail ? <PublicMedia asset={thumbnail} /> : <WorkVisualPlaceholder label={initiative.title} />}
                          </div>
                          <div className="v2-initiative-copy">
                            <small>{initiative.year ?? (initiative.startYear && initiative.endYear ? `${initiative.startYear}–${initiative.endYear}` : "Documented initiative")}</small>
                            <h3>{initiative.title}</h3>
                            <p>{heroTeaser(initiative.summary)}</p>
                          </div>
                          <div className={`v2-initiative-proof${initiative.primaryMetric?.trim().startsWith("₹") ? " v2-initiative-proof--currency" : ""}`}>
                            {initiative.primaryMetric && <strong>{initiative.primaryMetric}</strong>}
                            {initiative.primaryMetricLabel && <span>{initiative.primaryMetricLabel}</span>}
                          </div>
                          <span className="v2-initiative-arrow" aria-hidden="true"><ActionIcon /></span>
                        </Link>
                      );
                    })}
                  </div>

                  {cause.slug === "amaana-taleem" && !yearFiltered && (
                    <div className="v2-taleem-highlights" aria-label="Amaana Taleem documented pathways">
                      <div className="v2-taleem-highlight">
                        <strong>25 students</strong>
                        <span>Qur’an Nazira and Hifdh students sponsored combined, as of September 2026.</span>
                      </div>
                      <div className="v2-taleem-highlight">
                        <strong>50 children</strong>
                        <span>Stationery kits provided to orphan children through the 2025 Taleem initiative.</span>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
  );
}
