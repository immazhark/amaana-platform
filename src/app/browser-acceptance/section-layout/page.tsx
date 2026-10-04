import { ProgrammeNext } from "@/components/programme-next";
import "@/app/our-work/[slug]/campaign.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import evidenceStyles from "@/components/evidence-pathway.module.css";

export const dynamic = "force-dynamic";

export default function SectionLayoutFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  return <div className="v2-home">
    <section className="v2-section paper"><div className="v2-shell"><SectionHeading eyebrow="How Amaana serves" title="Different Needs. One Standard of Care." subtitle="Some needs return every year. Others arrive without warning. Amaana’s work combines recurring programmes with verified case-led assistance." /></div></section>
    <section className={`v2-section dark ${evidenceStyles.surface}`}><div className={`v2-shell ${evidenceStyles.grid}`}><div><p className="v2-section-label">See the evidence</p><h2 className="v2-section-title">The work does not end at the initiative page.</h2><p className="v2-section-intro">Impact, stories, public-safe media and transparency records continue the journey so visitors can understand what happened after support was given.</p></div><div className="v2-reminder"><span className="v2-reminder-label">Follow the trail</span><blockquote>Work → evidence → story → known outcome.</blockquote><Link className="v2-button ghost" href="/impact">Explore impact</Link></div></div></section>
    <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow="Take the next step" title="Understand first. Then decide how to stand with the work." subtitle="Explore completed work, read the stories behind it, or see whether a verified public appeal is currently active." /><div className="v2-hero-actions"><Link className="v2-button" href="/appeals">Support a verified need</Link><Link className="v2-text-link" href="/get-involved">Other ways to get involved →</Link></div></div></section>
    <div className="campaign-page"><ProgrammeNext /></div>
  </div>;
}
