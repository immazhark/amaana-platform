import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Qurbani Meat Distribution",
  description: "Amaana Foundation's documented Qurbani meat distribution work, including the 2026 preparation of 350 meat boxes for 350+ families in Hyderabad.",
};

const record2026 = [
  { value: "28", label: "sheep sacrificed", note: "campaign-published 2026 record" },
  { value: "350", label: "meat boxes prepared", note: "labelled for distribution" },
  { value: "~1 kg", label: "per box", note: "campaign-reported packing figure" },
  { value: "350+", label: "families reached", note: "documented 2026 outcome" },
] as const;

const process = [
  ["Qurbani", "The 2026 campaign record documents 28 sheep sacrificed for the distribution."],
  ["Preparation", "Meat was prepared for portioning and packing. Graphic process imagery is retained as documentary material, not used as spectacle."],
  ["Weighing", "Portions were weighed during preparation; individual scale readings are not treated as campaign-wide measurements."],
  ["Packing", "350 labelled meat boxes were prepared, with the campaign reporting approximately 1 kg per box."],
  ["Distribution", "The documented 2026 drive reports reaching more than 350 families."],
] as const;

export default async function QurbaniMeatDistributionPage() {
  const initiative = await getPublishedInitiativeBySlug("qurbani-meat-distribution");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const processMedia = media.slice(1, 4);
  const remainingMedia = media.slice(4);

  return (
    <div className="v2-home v2-qurbani-page">
      <section className="v2-qurbani-hero">
        <div className="v2-shell v2-qurbani-hero-grid">
          <div className="v2-qurbani-hero-copy">
            <p className="v2-kicker">Qurbani Meat Distribution · Hyderabad · 2025–2026</p>
            <h1>From sacrifice<br />to shared provision.</h1>
            <p>{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#record-2026">See the 2026 record</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>
          <div className="v2-qurbani-hero-media">
            {leadMedia ? (
              <PublicMedia asset={leadMedia} />
            ) : (
              <div className="v2-qurbani-evidence-placeholder" aria-label="Approved Qurbani media publication gate">
                <span>2026 field record</span>
                <strong>350</strong>
                <p>labelled meat boxes prepared</p>
                <small>Only authentic, privacy-approved Amaana media appears here. Selected original photographs are currently passing through the publication gate.</small>
              </div>
            )}
          </div>
        </div>
        <div className="v2-shell v2-qurbani-hero-line" aria-label="Qurbani distribution evidence chain">
          <span>Qurbani</span><i aria-hidden="true" /><span>Preparation</span><i aria-hidden="true" /><span>Weighing</span><i aria-hidden="true" /><span>Packing</span><i aria-hidden="true" /><span>Distribution</span>
        </div>
      </section>

      <section className="v2-qurbani-record" id="record-2026">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">The 2026 record</p><h2 className="v2-section-title">Four figures.<br />One documented distribution.</h2></div>
            <p className="v2-section-intro">These figures come from Amaana&apos;s campaign-published 2026 record. They stay attached to this drive rather than being turned into broader claims.</p>
          </div>
          <div className="v2-qurbani-metrics">
            {record2026.map((item, index) => (
              <article key={item.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <small>{item.note}</small>
              </article>
            ))}
          </div>
          <p className="v2-qurbani-source-note">Species wording is taken from Amaana&apos;s 2026 campaign records, not inferred from photographs. If a stronger primary record later conflicts, this page should be reconciled rather than silently overwritten.</p>
        </div>
      </section>

      <section className="v2-section paper v2-qurbani-story">
        <div className="v2-shell v2-qurbani-story-grid">
          <div>
            <p className="v2-section-label">Why this work matters</p>
            <h2>Care is visible in the details.</h2>
          </div>
          <div>
            <p>{initiative.story}</p>
            <p>The public record focuses on what Amaana can responsibly demonstrate: the preparation, the packed boxes, the known distribution figures and the continuity from a 2025 pilot into the larger documented 2026 drive.</p>
            <blockquote>Document the work. Protect people&apos;s dignity. Keep each number attached to its source.</blockquote>
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-qurbani-process">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">From Qurbani to distribution</p><h2 className="v2-section-title">The work between the number and the handover.</h2></div>
            <p className="v2-section-intro">The website does not turn slaughter into spectacle. Public imagery prioritises preparation, weighing, packing and distribution evidence; graphic frames remain outside the default visitor journey.</p>
          </div>
          <ol className="v2-qurbani-process-list">
            {process.map(([title, copy], index) => (
              <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>
            ))}
          </ol>
          {processMedia.length > 0 && <div className="v2-media-grid v2-media-grid-editorial" aria-label="Approved Qurbani preparation media">{processMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div>}
        </div>
      </section>

      <section className="v2-section v2-qurbani-dignity">
        <div className="v2-shell v2-qurbani-dignity-grid">
          <div className="v2-qurbani-dignity-mark"><span>Public evidence</span><strong>≠</strong><span>public exposure</span></div>
          <div><p className="v2-section-label">Dignity boundary</p><h2>Receiving help should not cost someone their privacy.</h2><p>Distribution photographs that identify recipients, especially children or people in vulnerable circumstances, require a stricter public-use decision. Amaana can demonstrate the work without making hardship the visual currency of the page.</p></div>
        </div>
      </section>

      <section className="v2-section paper v2-qurbani-field">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Field record</p><h2 className="v2-section-title">Authentic material, selectively shown.</h2></div><p className="v2-section-intro">Approved original photographs are preferred over designed social graphics. Near-duplicates, graphic preparation frames and unapproved identifiable people are deliberately left out.</p></div>
          {remainingMedia.length > 0 ? <div className="v2-media-grid v2-media-grid-editorial">{remainingMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div> : <div className="v2-qurbani-publication-note"><span>Publication gate active</span><strong>Real evidence deserves careful selection.</strong><p>Reviewed Qurbani originals have been inventoried. They will appear here only after storage, provenance and public-use approval are complete.</p></div>}
        </div>
      </section>

      <section className="v2-closing v2-qurbani-closing"><div className="v2-shell"><p className="v2-section-label">One drive within a wider amanah</p><h2>Seasonal service.<br />Documented with care.</h2><p>Explore the rest of Amaana&apos;s work or see how evidence is handled across the Foundation.</p><div className="v2-hero-actions" style={{ justifyContent: "center" }}><Link className="v2-button" href="/our-work">Explore all work</Link><Link className="v2-text-link" href="/transparency">See transparency →</Link></div></div></section>
    </div>
  );
}
