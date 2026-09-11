import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eid Gift Kits",
  description: "Seven years of Amaana Foundation's Eid Gift Kits initiative, from 85 families in 2020 to 710 kits distributed in 2026.",
};

const growth = [
  { year: 2020, families: 85, donations: "₹68,000.00", kitCost: "₹797" },
  { year: 2021, families: 171, donations: "₹226,008.74", kitCost: "₹1,327" },
  { year: 2022, families: 339, donations: "₹484,770.00", kitCost: "₹1,430" },
  { year: 2023, families: 408, donations: "₹610,153.28", kitCost: "₹1,500" },
  { year: 2024, families: 467, donations: "₹700,500.00", kitCost: "₹1,500" },
  { year: 2025, families: 650, donations: "₹1,110,742.53", kitCost: "₹1,709" },
  { year: 2026, families: 710, donations: null, kitCost: null },
] as const;

const breakdown2026 = [
  ["Women-led households of hardship", 201, "28.3%"],
  ["Children & vulnerable students", 134, "18.9%"],
  ["Masjid-linked", 86, "12.1%"],
  ["Other financially vulnerable", 118, "16.6%"],
  ["Daily wage labour & skilled", 65, "9.2%"],
  ["Widows (primary need)", 55, "7.7%"],
  ["Drivers & transport", 33, "4.6%"],
  ["Medical hardship & disability", 18, "2.5%"],
] as const;

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

  return (
    <div className="v2-home">
      <section className="v2-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Flagship initiative · Ramadan · 2020–2026</p>
            <h1 className="v2-display">Seven years of Eid Gift Kits.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">
              What began with 85 families in Ramadan 2020 grew into 710 Eid Gift Kits distributed in 2026 — a recurring community effort shaped around care, preparation and dignity.
            </p>
            <div className="v2-hero-proof" style={{ marginTop: "2.5rem" }}>
              <div><span className="v2-proof-number">85</span><span className="v2-proof-copy">families in the first year, 2020</span></div>
              <div><span className="v2-proof-number">710</span><span className="v2-proof-copy">Eid Gift Kits distributed in 2026</span></div>
              <div><span className="v2-proof-number">7</span><span className="v2-proof-copy">consecutive Ramadan seasons documented</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-origin v2-section">
        <div className="v2-shell">
          <p className="v2-section-label">Where it began</p>
          <h2>A family response during a difficult Ramadan.</h2>
          <p>
            During the hardship of 2020, before Amaana Foundation was formally registered, a family-led effort set out to help less fortunate households prepare for Eid. Support from family, friends and the wider community enabled the first distribution to reach 85 families. The effort continued year after year and became Amaana&apos;s longest-running documented initiative.
          </p>
        </div>
      </section>

      <section className="v2-section dark">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Seven-year growth</p>
              <h2 className="v2-section-title">From 85 to 710.</h2>
            </div>
            <p className="v2-section-intro">The figures below preserve the documented year-by-year growth. Financial figures shown here are available for 2020 through 2025; 2026 financial figures are intentionally not invented.</p>
          </div>

          <div className="v2-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {growth.map(item => (
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
            <p className="v2-section-intro">These historical figures reflect the documented donation totals and reported per-kit costs available for 2020–2025. Detailed expenditure notes remain separate from this summary and will be linked to source reports once the archive publication review is complete.</p>
          </div>

          <div className="v2-work-grid">
            {growth.filter(item => item.donations).map(item => (
              <article className="v2-work-card" key={item.year}>
                <small>{item.year}</small>
                <div>
                  <span className="v2-metric">{item.families}</span>
                  <p>families reached</p>
                  <h3>{item.donations}</h3>
                  <p>documented donations · reported kit cost {item.kitCost}</p>
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
            <p className="v2-section-intro">The approved website dataset totals exactly 710. Historical creatives with earlier category discrepancies will be preserved as source material but will not override these approved figures.</p>
          </div>

          <div className="v2-work-grid">
            {breakdown2026.map(([label, count, share]) => (
              <article className="v2-work-card" key={label}>
                <small>{share}</small>
                <div>
                  <span className="v2-metric">{count}</span>
                  <h3>{label}</h3>
                </div>
              </article>
            ))}
          </div>
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
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Media & evidence</p>
            <h2 className="v2-section-title">Real Amaana material will live here.</h2>
            <p className="v2-section-intro">The page structure is ready for year-by-year photography, packing moments, kit contents, historical creatives, video and report links. No placeholder beneficiary imagery or invented media is being used while the source archive is still under asset-level review.</p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Publication gate</span>
            <blockquote>Authentic media only.</blockquote>
            <p>Assets will appear only after provenance, privacy and public-use approval are recorded.</p>
          </div>
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
