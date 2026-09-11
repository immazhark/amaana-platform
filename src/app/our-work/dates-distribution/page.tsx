import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dates Distribution",
  description: "Amaana Foundation's documented Ramadan dates distribution, including 162 kg distributed through community support.",
};

const record = [
  { value: "162 kg", label: "dates distributed", note: "documented campaign figure" },
  { value: "Ramadan", label: "season of service", note: "distribution context" },
  { value: "Community", label: "supported effort", note: "enabled through donor support" },
] as const;

export default async function DatesDistributionPage() {
  const initiative = await getPublishedInitiativeBySlug("dates-distribution");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const galleryMedia = media.slice(1);

  return (
    <div className="v2-home v2-dates-page">
      <section className="v2-dates-hero">
        <div className="v2-shell v2-dates-hero-grid">
          <div className="v2-dates-copy">
            <p className="v2-kicker">Dates Distribution · Ramadan</p>
            <h1>Simple provision.<br />Shared at the right time.</h1>
            <p>{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#record">See the record</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>
          <div className="v2-dates-visual">
            {leadMedia ? <PublicMedia asset={leadMedia} /> : <div className="v2-dates-placeholder"><span>Ramadan field record</span><strong>162</strong><p>kilograms of dates distributed</p><small>Authentic Amaana media appears here only after provenance and public-use approval.</small></div>}
          </div>
        </div>
      </section>

      <section className="v2-dates-record" id="record">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">The documented record</p><h2 className="v2-section-title">A modest initiative,<br />kept specific.</h2></div>
            <p className="v2-section-intro">The public claim stays narrow: Amaana&apos;s documented Ramadan dates distribution records 162 kg distributed. The website does not turn that figure into an unsupported family or beneficiary count.</p>
          </div>
          <div className="v2-dates-ledger">{record.map((item,index)=><article key={item.label}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.value}</strong><h3>{item.label}</h3><small>{item.note}</small></article>)}</div>
        </div>
      </section>

      <section className="v2-section paper v2-dates-story">
        <div className="v2-shell v2-dates-story-grid">
          <div><p className="v2-section-label">Why dates</p><h2>Seasonal service does not need exaggerated language to matter.</h2></div>
          <div><p>{initiative.story}</p><p>This page keeps the initiative connected to its actual scale and context. The strongest public evidence is the documented quantity, the real preparation material and the known Ramadan setting.</p><blockquote>Specificity builds trust: say what is known, and leave what is not known unstated.</blockquote></div>
        </div>
      </section>

      <section className="v2-section dark v2-dates-evidence">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">Evidence boundary</p><h2 className="v2-section-title">What this page can responsibly show.</h2></div><p className="v2-section-intro">Approved original photographs can document procurement, packing and distribution context. Designed campaign graphics remain supporting collateral, not substitutes for original field evidence.</p></div>
          <div className="v2-dates-boundaries"><article><span>01</span><h3>Known quantity</h3><p>162 kg is the approved documented campaign figure used by the current initiative record.</p></article><article><span>02</span><h3>No invented reach</h3><p>No family count is published unless a direct source supports it.</p></article><article><span>03</span><h3>Real media first</h3><p>Original Amaana photography is preferred over social artwork whenever suitable originals exist.</p></article></div>
        </div>
      </section>

      <section className="v2-section v2-dates-field"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Field record</p><h2 className="v2-section-title">Ramadan, documented without spectacle.</h2></div><p className="v2-section-intro">The gallery remains gated until campaign files have been individually reviewed for authenticity, duplication, identifiable people and public-use suitability.</p></div>{galleryMedia.length>0?<div className="v2-media-grid v2-media-grid-editorial">{galleryMedia.map(asset=><PublicMedia asset={asset} key={asset.id}/>)}</div>:<div className="v2-dates-publication-note"><span>Publication gate active</span><strong>162 kg is already documented. The imagery still earns its place.</strong><p>Approved originals will be added after the Dates archive is inspected file by file.</p></div>}</div></section>

      <section className="v2-closing v2-dates-closing"><div className="v2-shell"><p className="v2-section-label">Seasonal service, one part of the whole</p><h2>Quiet work.<br />Clear record.</h2><p>Explore Amaana&apos;s other initiatives or see how evidence and privacy are handled across the Foundation.</p><div className="v2-hero-actions" style={{justifyContent:"center"}}><Link className="v2-button" href="/our-work">Explore all work</Link><Link className="v2-text-link" href="/transparency">See transparency →</Link></div></div></section>
    </div>
  );
}
