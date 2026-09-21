import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { programmeBySlug } from "@/lib/master-copy";
import { getSponsorEducationHeroMedia } from "@/lib/sponsorship-media";
import "./sponsor-education.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsor Education",
  description: "Support Hifdh, Quran Nazira, school or college education through the Amaana Taleem Initiative.",
  alternates: { canonical: "/get-involved/sponsor-education" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/get-involved/sponsor-education", title: "Sponsor Education | Amaana Foundation", description: "Choose an education sponsorship path through the Amaana Taleem Initiative." },
  twitter: { images: ["/twitter-image"], card: "summary", title: "Sponsor Education | Amaana Foundation", description: "Choose an education sponsorship path through the Amaana Taleem Initiative." },
};

const islamicPaths = [
  { marker: "01", title: "Sponsor a Hifdh Student", copy: programmeBySlug("taleem-hifdh-sponsorship")!.story, subject: "Amaana Taleem – Sponsor Hifdh" },
  { marker: "02", title: "Sponsor Qur’an Nazira Education", copy: programmeBySlug("taleem-nazira-sponsorship")!.story, subject: "Amaana Taleem – Sponsor Quran Nazira" },
] as const;
const emailHref = (subject: string) => `mailto:amaanafoundation24@gmail.com?subject=${encodeURIComponent(subject)}`;

export default async function SponsorEducationPage() {
  const heroMedia = await getSponsorEducationHeroMedia();

  return (
    <div className="v2-home taleem-sponsor">
      <div className="v2-shell taleem-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/get-involved">Get involved</Link><span aria-hidden="true"> / </span><span>Sponsor education</span></nav></div>
      <PageHero variant="level2" eyebrow="Amaana Taleem Initiative" title="Knowledge should open doors." description={<p>As of September 2026, 25 students across Qur’an Nazira and Hifdh were being sponsored through Amaana by multiple donors. School and college sponsorship is a developing pathway.</p>} actions={[{label:"Choose a sponsorship path",href:"#sponsorship-paths"},{label:"Explore Taleem",href:"/our-work/taleem",secondary:true}]} visual={heroMedia ? <PublicMedia asset={heroMedia} priority /> : undefined} visualKicker="Education Sponsorship" visualTitle="Learn. Grow. Continue." visualNote="Hifdh · Qur’an Nazira · school and college pathways, matched to verified educational need." />

      <div id="sponsorship-paths" className="taleem-paths">
        <section className="v2-shell taleem-programme" aria-labelledby="islamic-education-title"><header className="taleem-section-head"><div><span className="taleem-section-number">01</span><p className="v2-section-label">Islamic education</p><h2 id="islamic-education-title">Sponsor Islamic Education</h2></div><p>Support sustained Qur’anic learning through one of two defined study paths.</p></header><div className="taleem-islamic-grid">{islamicPaths.map(path => <article className="taleem-path" key={path.title}><span aria-hidden="true">{path.marker}</span><h3>{path.title}</h3><p>{path.copy}</p><a href={emailHref(path.subject)}>Ask about this sponsorship <span aria-hidden="true">↗</span></a></article>)}</div></section>

        <section className="taleem-school" aria-labelledby="child-education-title"><div className="v2-shell taleem-school-grid"><div><span className="taleem-section-number">02</span><p className="v2-section-label">School and college</p><h2 id="child-education-title">Sponsor a Student’s School or College Education</h2></div><div><p className="taleem-school-lead">Developing pathway — verified school and college education support.</p><p>Amaana Taleem Initiative is designed to extend educational assistance to verified students from financially vulnerable households whose schooling or college education may be at risk because of fees or other essential academic costs. Support under this pathway will be matched to a clearly identified educational need, with verification and responsible follow-through before assistance is provided.</p><a className="v2-button" href={emailHref("Amaana Taleem – Sponsor a Child's Education")}>Ask about school or college sponsorship</a></div></div></section>

        <section className="v2-shell taleem-process" aria-labelledby="process-title"><div className="taleem-section-head"><div><p className="v2-section-label">How it works</p><h2 id="process-title">A clear path from interest to support.</h2></div><p>Sponsorship begins with a conversation, not an assumption about a student’s circumstances.</p></div><ol><li><span>01</span><div><h3>Choose a path</h3><p>Tell Amaana which education route you are interested in supporting.</p></div></li><li><span>02</span><div><h3>Review the available need</h3><p>The team confirms the learner, institution and current sponsorship scope.</p></div></li><li><span>03</span><div><h3>Confirm your support</h3><p>You receive the relevant details and can decide whether to proceed.</p></div></li><li><span>04</span><div><h3>Follow responsibly</h3><p>Updates are shared in a way that protects the dignity and privacy of the student.</p></div></li></ol></section>
      </div>

      <section className="taleem-closing"><div className="v2-shell"><p className="v2-section-label">Start here</p><h2>Which learning journey would you like to support?</h2><div className="v2-hero-actions"><a className="v2-button" href={emailHref("Amaana Taleem – Education sponsorship enquiry")}>Contact Amaana about sponsorship</a><Link className="v2-text-link" href="/our-work/taleem">Explore the Taleem Initiative →</Link></div></div></section>
    </div>
  );
}
