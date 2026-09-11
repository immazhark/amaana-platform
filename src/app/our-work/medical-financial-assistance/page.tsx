import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medical & Financial Assistance",
  description: "Amaana Foundation's case-led medical, livelihood and financial assistance work, reviewed with supporting information before public appeals or assistance are considered.",
};

const workflow = [
  ["Request", "A family or referrer shares the situation privately."],
  ["Evidence", "Relevant supporting information is requested where needed."],
  ["Review", "Known circumstances and documents are assessed before a decision."],
  ["Decision", "Amaana may assist privately, decline, request more information or approve a public appeal."],
  ["Closure", "Known outcomes and payment records are retained without exposing private case material."],
] as const;

export default async function MedicalFinancialAssistancePage() {
  const initiative = await getPublishedInitiativeBySlug("medical-financial-assistance");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const galleryMedia = media.slice(1);

  return (
    <div className="v2-home v2-medical-page">
      <section className="v2-medical-hero">
        <div className="v2-shell v2-medical-hero-grid">
          <div className="v2-medical-copy">
            <p className="v2-kicker">Medical & Financial Assistance · Case-led support</p>
            <h1>Help begins<br />in private.</h1>
            <p>{initiative.summary}</p>
            <div className="v2-hero-actions"><Link className="v2-button" href="/request-assistance">Request assistance</Link><a className="v2-button ghost" href="#method">See the review method</a></div>
          </div>
          <div className="v2-medical-signal"><span>One documented medical appeal</span><strong>₹4.82L</strong><p>raised in the approved initiative record</p><small>This is one case-specific figure, not a total for all medical or financial assistance.</small></div>
        </div>
      </section>

      <section className="v2-medical-boundary"><div className="v2-shell"><div><small>Private by default</small><strong>Medical records, identity documents, bank details and family circumstances are verification material — not public content.</strong></div><div><small>Public only after review</small><strong>A case becomes an appeal only when publication is separately approved and the story is reduced to public-safe information.</strong></div></div></section>

      <section className="v2-section paper v2-medical-story"><div className="v2-shell v2-medical-story-grid"><div><p className="v2-section-label">What this initiative is</p><h2>Case work, not a catalogue of hardship.</h2></div><div><p>{initiative.story}</p><p>Medical and financial hardship can involve intensely private records. The website therefore separates the evidence required to make a responsible decision from the limited information, if any, that may later be suitable for a public appeal.</p><blockquote>The purpose of verification is to make a better decision — not to turn someone&apos;s private difficulty into content.</blockquote></div></div></section>

      <section className="v2-section dark v2-medical-method" id="method"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Review method</p><h2 className="v2-section-title">Five stages before public exposure.</h2></div><p className="v2-section-intro">Not every request becomes an appeal. The process can stop, continue privately or move into publication only after a separate decision.</p></div><ol className="v2-medical-flow">{workflow.map(([title,copy],index)=><li key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></div></section>

      <section className="v2-section v2-medical-proof"><div className="v2-shell v2-medical-proof-grid"><div>{leadMedia?<PublicMedia asset={leadMedia}/>:<div className="v2-medical-placeholder"><span>Evidence gate</span><strong>PRIVATE</strong><p>Case documents are never used as decorative website media.</p></div>}</div><div><p className="v2-section-label">What can become public</p><h2>Enough to understand the need. Not enough to expose the person.</h2><ul><li>Public-safe summary of the need</li><li>Approved fundraising target or known amount</li><li>General location/category where appropriate</li><li>Non-sensitive updates and known outcome</li></ul><p>Anything beyond that remains subject to privacy, necessity and explicit publication review.</p></div></div></section>

      <section className="v2-section paper v2-medical-field"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Public case evidence</p><h2 className="v2-section-title">Dignity before detail.</h2></div><p className="v2-section-intro">Only approved, public-safe media connected to this initiative can render here. Raw medical documents, personal IDs and bank records are categorically unsuitable for a public gallery.</p></div>{galleryMedia.length>0?<div className="v2-media-grid v2-media-grid-editorial">{galleryMedia.map(asset=><PublicMedia asset={asset} key={asset.id}/>)}</div>:<div className="v2-medical-publication-note"><span>Publication gate active</span><strong>No private proof is used to make the page feel fuller.</strong><p>Case material will appear publicly only when it has a legitimate storytelling role and has passed privacy approval.</p></div>}</div></section>

      <section className="v2-closing v2-medical-closing"><div className="v2-shell"><p className="v2-section-label">Need support?</p><h2>Start privately.<br />Stay informed.</h2><p>Submit a request for review, or learn how Amaana decides what can responsibly become a public appeal.</p><div className="v2-hero-actions" style={{justifyContent:"center"}}><Link className="v2-button" href="/request-assistance">Request assistance</Link><Link className="v2-text-link" href="/how-we-verify">How we verify →</Link></div></div></section>
    </div>
  );
}
