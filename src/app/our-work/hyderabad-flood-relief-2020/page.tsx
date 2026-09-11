import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hyderabad Flood Relief 2020",
  description: "Amaana Foundation's early grassroots relief activity during the Hyderabad floods of 2020.",
};

export default async function HyderabadFloodReliefPage() {
  const initiative = await getPublishedInitiativeBySlug("hyderabad-flood-relief-2020");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const galleryMedia = media.slice(1);

  return (
    <div className="v2-home v2-flood-page">
      <section className="v2-flood-hero"><div className="v2-shell v2-flood-hero-grid"><div className="v2-flood-copy"><p className="v2-kicker">Hyderabad Flood Relief · 2020</p><h1>Before the name,<br />there was the response.</h1><p>{initiative.summary}</p><div className="v2-hero-actions"><a className="v2-button" href="#record">See the record</a><Link className="v2-button ghost" href="/about">Read our story</Link></div></div><div className="v2-flood-visual">{leadMedia?<PublicMedia asset={leadMedia}/>:<div className="v2-flood-placeholder"><span>Early field record</span><strong>2020</strong><p>community relief during the Hyderabad floods</p><small>This initiative belongs to Amaana&apos;s grassroots period before formal registration.</small></div>}</div></div></section>

      <section className="v2-flood-context" id="record"><div className="v2-shell"><div><span>01</span><strong>Local emergency</strong><p>Relief activity responded to hardship created by the Hyderabad floods of 2020.</p></div><div><span>02</span><strong>Grassroots period</strong><p>The work predates Amaana Foundation&apos;s later formal legal registration.</p></div><div><span>03</span><strong>Evidence restraint</strong><p>No beneficiary total, spend figure or distribution count is published here without a directly reconciled source.</p></div></div></section>

      <section className="v2-section paper v2-flood-story"><div className="v2-shell v2-flood-story-grid"><div><p className="v2-section-label">An early chapter</p><h2>Service existed before the structure around it.</h2></div><div><p>{initiative.story}</p><p>This page intentionally treats the flood work as an early response rather than retroactively presenting it as an activity of a legally registered Foundation. The public narrative should preserve that chronology accurately.</p><blockquote>History is more trustworthy when the timeline is allowed to be precise.</blockquote></div></div></section>

      <section className="v2-section dark v2-flood-evidence"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Archive standard</p><h2 className="v2-section-title">Show what survives.<br />Do not manufacture what does not.</h2></div><p className="v2-section-intro">The flood archive is being treated as historical documentary material. Photos, messages and distribution evidence will be published only when their date, context and public-use suitability can be established.</p></div><div className="v2-flood-rules"><article><span>01</span><h3>Date before detail</h3><p>Material must be tied confidently to the 2020 flood response before it enters this page.</p></article><article><span>02</span><h3>Context before caption</h3><p>Captions should describe what a source proves, not infer an unsupported location, person or quantity.</p></article><article><span>03</span><h3>Dignity before drama</h3><p>Images of people in distress require a higher privacy and necessity threshold than logistics or relief-material imagery.</p></article></div></div></section>

      <section className="v2-section v2-flood-field"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Historical field record</p><h2 className="v2-section-title">Archive material, selectively restored.</h2></div><p className="v2-section-intro">Approved originals will appear here after the 2020 archive is individually reviewed. Until then, the page remains truthful rather than filling the space with stock or unrelated imagery.</p></div>{galleryMedia.length>0?<div className="v2-media-grid v2-media-grid-editorial">{galleryMedia.map(asset=><PublicMedia asset={asset} key={asset.id}/>)}</div>:<div className="v2-flood-publication-note"><span>Archive review active</span><strong>The page can remain visually restrained until the right evidence is cleared.</strong><p>No placeholder beneficiary photography will be introduced.</p></div>}</div></section>

      <section className="v2-closing v2-flood-closing"><div className="v2-shell"><p className="v2-section-label">From grassroots response to continuing service</p><h2>One early chapter.<br />Part of a longer story.</h2><p>Return to Amaana&apos;s story or explore the initiatives that followed.</p><div className="v2-hero-actions" style={{justifyContent:"center"}}><Link className="v2-button" href="/about">Our story</Link><Link className="v2-text-link" href="/our-work">Explore our work →</Link></div></div></section>
    </div>
  );
}
