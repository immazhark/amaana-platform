import type { Metadata } from "next";
import Link from "next/link";
import "./sponsor-education.css";

export const metadata: Metadata = {
  title: "Sponsor Education",
  description: "Support Hifdh, Quran Nazira, school or college education through the Amaana Taleem Initiative.",
  alternates: { canonical: "/get-involved/sponsor-education" },
  openGraph: {
    type: "website",
    url: "/get-involved/sponsor-education",
    title: "Sponsor Education | Amaana Foundation",
    description: "Choose an education sponsorship path through the Amaana Taleem Initiative.",
  },
};

const islamicPaths = [
  {
    marker: "01",
    title: "Sponsor Hifdh",
    copy: "Help a student continue the committed study and memorisation of the Qur’an through an eligible Hifdh programme.",
    subject: "Amaana Taleem – Sponsor Hifdh",
  },
  {
    marker: "02",
    title: "Sponsor Quran Nazira",
    copy: "Support a student learning to read the Qur’an with accuracy, consistency and guided instruction.",
    subject: "Amaana Taleem – Sponsor Quran Nazira",
  },
] as const;

const emailHref = (subject: string) => `mailto:amaanafoundation24@gmail.com?subject=${encodeURIComponent(subject)}`;

export default function SponsorEducationPage() {
  return (
    <div className="v2-home taleem-sponsor">
      <div className="v2-shell taleem-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/get-involved">Get involved</Link><span aria-hidden="true"> / </span><span>Sponsor education</span></nav></div>

      <section className="taleem-hero">
        <div className="v2-shell taleem-hero-grid">
          <div><p className="v2-kicker">Amaana Taleem Initiative</p><h1>Help learning continue.</h1></div>
          <div><p>Choose between Islamic education sponsorship and a child’s school or college education. Amaana confirms the learner, institution and current need before a sponsorship is arranged.</p><a className="v2-button" href="#sponsorship-paths">Choose a sponsorship path</a></div>
        </div>
      </section>

      <main id="sponsorship-paths" className="taleem-paths">
        <section className="v2-shell taleem-programme" aria-labelledby="islamic-education-title">
          <header className="taleem-section-head"><div><span className="taleem-section-number">01</span><p className="v2-section-label">Islamic education</p><h2 id="islamic-education-title">Sponsor Islamic Education</h2></div><p>Support sustained Qur’anic learning through one of two defined study paths.</p></header>
          <div className="taleem-islamic-grid">
            {islamicPaths.map(path => <article className="taleem-path" key={path.title}><span aria-hidden="true">{path.marker}</span><h3>{path.title}</h3><p>{path.copy}</p><a href={emailHref(path.subject)}>Ask about this sponsorship <span aria-hidden="true">↗</span></a></article>)}
          </div>
        </section>

        <section className="taleem-school" aria-labelledby="child-education-title">
          <div className="v2-shell taleem-school-grid">
            <div><span className="taleem-section-number">02</span><p className="v2-section-label">School and college</p><h2 id="child-education-title">Sponsor a Child’s Education</h2></div>
            <div><p className="taleem-school-lead">Help a child or young person continue their formal education at school or college.</p><p>The exact support is based on a verified learner’s current educational need. Amaana will share the available scope before you commit, without publishing private student information.</p><a className="v2-button" href={emailHref("Amaana Taleem – Sponsor a Child's Education")}>Ask about school or college sponsorship</a></div>
          </div>
        </section>

        <section className="v2-shell taleem-process" aria-labelledby="process-title">
          <div className="taleem-section-head"><div><p className="v2-section-label">How it works</p><h2 id="process-title">A clear path from interest to support.</h2></div><p>Sponsorship begins with a conversation, not an assumption about a student’s circumstances.</p></div>
          <ol>
            <li><span>01</span><div><h3>Choose a path</h3><p>Tell Amaana which education route you are interested in supporting.</p></div></li>
            <li><span>02</span><div><h3>Review the available need</h3><p>The team confirms the learner, institution and current sponsorship scope.</p></div></li>
            <li><span>03</span><div><h3>Confirm your support</h3><p>You receive the relevant details and can decide whether to proceed.</p></div></li>
            <li><span>04</span><div><h3>Follow responsibly</h3><p>Updates are shared in a way that protects the dignity and privacy of the student.</p></div></li>
          </ol>
        </section>
      </main>

      <section className="taleem-closing"><div className="v2-shell"><p className="v2-section-label">Start here</p><h2>Which learning journey would you like to support?</h2><div className="v2-hero-actions"><a className="v2-button" href={emailHref("Amaana Taleem – Education sponsorship enquiry")}>Contact Amaana about sponsorship</a><Link className="v2-text-link" href="/our-work/taleem-initiative-2025">Explore the Taleem Initiative →</Link></div></div></section>
    </div>
  );
}
