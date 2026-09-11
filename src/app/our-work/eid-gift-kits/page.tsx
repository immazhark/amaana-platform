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

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const remainingMedia = media.slice(1);

  return (
    <div className="v2-home v2-eid-page">
      <section className="v2-hero v2-eid-hero">
        <div className="v2-shell v2-eid-hero-grid">
          <div className="v2-eid-hero-copy">
            <p className="v2-kicker">Flagship initiative · Ramadan · 2020–2026</p>
            <h1 className="v2-display">A small kit.<br />A big difference.</h1>
            <p className="v2-hero-copy">{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#seven-year-story">Follow the seven-year story</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>
          <div className="v2-eid-hero-visual">
            {leadMedia ? <PublicMedia asset={leadMedia} /> : <div className="v2-eid-hero-placeholder" aria-label="Approved media publication gate"><span>Ramadan · Hyderabad</span><strong>{latestYear.families}</strong><p>Eid Gift Kits distributed in {latestYear.year}</p><small>Authentic photography appears here only after public-use approval.</small></div>}
          </div>
        </div>
        <div className="v2-shell v2-eid-proof-strip">
          <div><span>{firstYear.families}</span><small>families reached in {firstYear.year}</small></div>
          <div><span>{evidence.history.length}</span><small>consecutive Ramadan seasons</small></div>
          <div><span>{latestYear.families}</span><small>Eid Gift Kits in {latestYear.year}</small></div>
          <div><span>Hyderabad</span><small>community-rooted service</small></div>
        </div>
      </section>

      <section className="v2-section v2-eid-origin">
        <div className="v2-shell v2-eid-editorial">
          <div><p className="v2-section-label">Where it began</p><h2>Ramadan 2020.<br />A difficult year.<br />A decision to help.</h2></div>
          <div><p className="v2-eid-dropcap">During the hardship of 2020, before Amaana Foundation was formally registered, a family-led effort set out to help less fortunate households prepare for Eid.</p><p>Support from family, friends and the wider community enabled the first distribution to reach {firstYear.families} families. The effort returned the next Ramadan, and the next — becoming Amaana&apos;s longest-running documented initiative.</p><blockquote>Prepared with care. Delivered with dignity. Remembered with gratitude.</blockquote></div>
        </div>
      </section>

      <section className="v2-section dark v2-eid-growth" id="seven-year-story">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Seven Ramadans</p><h2 className="v2-section-title">From {firstYear.families} families to {latestYear.families} Eid Gift Kits.</h2></div><p className="v2-section-intro">Each point is drawn from the validated initiative record. The line shows continuity, not a promise of uninterrupted growth.</p></div>
          <div className="v2-eid-growth-line" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {evidence.history.map((item, index) => <div className="v2-eid-growth-year" key={item.year}><span className="v2-eid-growth-index">0{index + 1}</span><strong>{item.families}</strong><b>{item.year}</b><small>{item.year === 2026 ? "Eid Gift Kits" : "families reached"}</small></div>)}
          </div>
        </div>
      </section>

      <section className="v2-section paper v2-eid-records">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">The record behind the story</p><h2 className="v2-section-title">Specific years. Specific figures.</h2></div><p className="v2-section-intro">Historical donation totals and reported costs stay attached to their own campaign year. Missing 2026 financial values are intentionally not inferred.</p></div>
          <div className="v2-eid-ledger">{evidence.history.filter(item => item.donations).map(item => <article className="v2-eid-ledger-row" key={item.year}><div className="v2-eid-ledger-year">{item.year}</div><div><strong>{item.families}</strong><span>families</span></div><div><strong>{item.donations}</strong><span>documented donations</span></div><div><strong>{item.kitCost ?? "—"}</strong><span>reported kit cost</span></div>{item.detailedExpenditure && <p>{item.detailedExpenditure} documented total expenditure. {item.notes}</p>}</article>)}</div>
        </div>
      </section>

      <section className="v2-section v2-eid-people">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">2026 distribution</p><h2 className="v2-section-title">710 kits. Different circumstances. One community.</h2></div><p className="v2-section-intro">These approved categories total exactly 710. They describe circumstances without turning individual hardship into spectacle.</p></div>
          <div className="v2-eid-breakdown">{evidence.breakdown2026.map((item, index) => <article key={item.label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.count}</strong><h3>{item.label}</h3><small>{item.share}</small></article>)}</div>
          <p className="v2-eid-source-note">{evidence.sourceStatus}</p>
        </div>
      </section>

      <section className="v2-section paper v2-eid-process">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">From support to delivery</p><h2 className="v2-section-title">An amanah carried through.</h2></div><p className="v2-section-intro">The initiative is more than a distribution day. It moves from support through procurement, preparation and delivery into a documented record.</p></div>
          <ol className="v2-eid-process-list">{journey.map(([title, copy], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </div>
      </section>

      <section className="v2-section dark v2-eid-gallery">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">The work, as it happened</p><h2 className="v2-section-title">Authentic Amaana material only.</h2></div><p className="v2-section-intro">Photography, video and public-safe evidence appear only after provenance, privacy and public-use review. No stock or AI-generated beneficiary imagery is substituted.</p></div>
          {remainingMedia.length > 0 ? <div className="v2-media-grid v2-media-grid-editorial" aria-label="Approved Eid Gift Kits media and evidence">{remainingMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div> : media.length > 0 ? <p className="v2-eid-media-note">The approved lead asset appears above. Additional reviewed material will join this record when published.</p> : <div className="v2-reminder"><span className="v2-reminder-label">Publication gate active</span><blockquote>Real moments deserve real photographs.</blockquote><p>No asset is displayed until its provenance, privacy and public-use approval are recorded.</p></div>}
        </div>
      </section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Seven years. One continuing amanah.</p><h2>From our hearts to their homes.</h2><p>Eid Gift Kits are one chapter in Amaana&apos;s wider work of practical, faith-inspired service.</p><div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/our-work">Explore all work</Link><Link className="v2-text-link" href="/impact">See documented impact →</Link></div></div></section>
    </div>
  );
}
