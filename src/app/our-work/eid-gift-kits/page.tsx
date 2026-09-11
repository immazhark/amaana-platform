import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { parseEidKitsEvidence } from "@/lib/eid-kits-evidence";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eid Gift Kits",
  description: "Seven years of Amaana Foundation's Eid Gift Kits initiative, from 85 families in 2020 to 710 kits distributed in 2026.",
};

const journey = [
  ["Community appeal", "The initiative begins by inviting support for a documented Ramadan distribution."],
  ["Support received", "Contributions are tracked before procurement and preparation begin."],
  ["Thoughtful procurement", "Kit contents and supporting items are sourced for the planned distribution."],
  ["Packing & preparation", "Kits are assembled and prepared before delivery."],
  ["Distribution", "Support is delivered to identified households and community groups with dignity."],
  ["Gratitude & record", "Known figures, updates and documented outcomes are preserved for donors and future reporting."],
] as const;

export default async function EidGiftKitsPage() {
  const initiative = await getPublishedInitiativeBySlug("eid-gift-kits");
  if (!initiative) notFound();

  const evidence = parseEidKitsEvidence(initiative.financialSummary);
  if (!evidence) notFound();

  const firstYear = evidence.history.find(item => item.year === 2020);
  const latestYear = evidence.history.find(item => item.year === 2026);
  if (!firstYear || !latestYear) notFound();

  return (
    <div className="v2-home">
      <section className="v2-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Flagship initiative · Ramadan · 2020–2026</p>
            <h1 className="v2-display">Seven years of Eid Gift Kits.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">{initiative.summary}</p>
            <div className="v2-hero-proof" style={{ marginTop: "2.5rem" }}>
              <div><span className="v2-proof-number">{firstYear.families}</span><span className="v2-proof-copy">families in the first documented year, {firstYear.year}</span></div>
              <div><span className="v2-proof-number">{latestYear.families}</span><span className="v2-proof-copy">Eid Gift Kits distributed in {latestYear.year}</span></div>
              <div><span className="v2-proof-number">{evidence.history.length}</span><span className="v2-proof-copy">consecutive Ramadan seasons documented</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-origin v2-section">
        <div className="v2-shell">
          <p className="v2-section-label">Where it began</p>
          <h2>A family response during a difficult Ramadan.</h2>
          <p>
            During the hardship of 2020, before Amaana Foundation was formally registered, a family-led effort set out to help less fortunate households prepare for Eid. Support from family, friends and the wider community enabled the first distribution to reach {firstYear.families} families. The effort continued year after year and became Amaana&apos;s longest-running documented initiative.
          </p>
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Seven-year growth</p>
              <h2 className="v2-section-title">From {firstYear.families} to {latestYear.families}.</h2>
            </div>
            <p className="v2-section-intro">The figures below come from the validated initiative evidence payload. Financial figures are shown only where documented; missing 2026 financial values are intentionally not inferred.</p>
          </div>

          <div className="v2-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {evidence.history.map(item => (
              <div className="v2-year" key={item.year}>
                <strong>{item.year}</strong>
                <span>{item.families}</span>
                <small>{item.year === 2026 ? "Eid Gift Kits" : "families"}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Documented financial trail</p>
              <h2 className="v2-section-title">Growth with records behind it.</h2>
            </div>
            <p className="v2-section-intro">Historical donation totals, reported per-kit costs and expenditure notes remain attached to their specific year so figures are not mixed across campaigns.</p>
          </div>

          <div className="v2-work-grid">
            {evidence.history.filter(item => item.donations).map(item => (
              <article className="v2-work-card" key={item.year}>
                <small>{item.year}</small>
                <div>
                  <span className="v2-metric">{item.families}</span>
                  <p>families reached</p>
                  <h3>{item.donations}</h3>
                  <p>documented donations{item.kitCost ? ` · reported kit cost ${item.kitCost}` : ""}</p>
                  {item.detailedExpenditure && <p>Documented total expenditure: {item.detailedExpenditure}</p>}
                  {item.notes && <p>{item.notes}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">2026 distribution</p>
              <h2 className="v2-section-title">Who the 710 kits reached.</h2>
            </div>
            <p className="v2-section-intro">The publication validator requires these categories to total exactly 710 before this evidence can render. Historical source discrepancies remain source records; they do not silently replace the approved website dataset.</p>
          </div>

          <div className="v2-work-grid">
            {evidence.breakdown2026.map(item => (
              <article className="v2-work-card" key={item.label}>
                <small>{item.share}</small>
                <div>
                  <span className="v2-metric">{item.count}</span>
                  <h3>{item.label}</h3>
                </div>
              </article>
            ))}
          </div>
          <p className="v2-section-intro" style={{ marginTop: "2rem" }}>{evidence.sourceStatus}</p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">From support to delivery</p>
              <h2 className="v2-section-title">Care carried through a process.</h2>
            </div>
            <p className="v2-section-intro">This is the initiative-specific journey. Amaana&apos;s broader verification and assistance workflow remains documented separately.</p>
          </div>

          <div className="v2-journey">
            {journey.map(([title, copy]) => (
              <div className="v2-journey-step" key={title}><b>{title}</b><span>{copy}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-faith">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Media & evidence</p>
              <h2 className="v2-section-title">Authentic Amaana material only.</h2>
            </div>
            <p className="v2-section-intro">Approved photography, video and public-safe reports appear here only after provenance, privacy and public-use review. Placeholder beneficiary imagery is never substituted.</p>
          </div>

          {initiative.mediaAssets.length > 0 ? (
            <div className="v2-media-grid" aria-label="Approved Eid Gift Kits media and evidence">
              {initiative.mediaAssets.map(asset => <PublicMedia asset={asset} key={asset.id} />)}
            </div>
          ) : (
            <div className="v2-reminder">
              <span className="v2-reminder-label">Publication gate active</span>
              <blockquote>Authentic media only.</blockquote>
              <p>No asset is displayed until its provenance, privacy and public-use approval are recorded.</p>
            </div>
          )}
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue exploring</p>
          <h2>One initiative within a wider amanah of service.</h2>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore all work</Link>
            <Link className="v2-text-link" href="/impact">Explore impact →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
