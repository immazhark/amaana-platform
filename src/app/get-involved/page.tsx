import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { getGetInvolvedHeroMedia } from "@/lib/get-involved-media";
import styles from "./get-involved-audit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Ways to support, follow and participate in Amaana Foundation’s work in Hyderabad, including education sponsorship through the Amaana Taleem Initiative.",
  alternates: { canonical: "/get-involved" },
  openGraph: {
    type: "website",
    url: "/get-involved",
    title: "Get Involved | Amaana Foundation",
    description: "Support Amaana through education sponsorship, verified appeals, volunteering, responsible sharing and assistance referrals.",
  },
  twitter: {
    card: "summary",
    title: "Get Involved | Amaana Foundation",
    description: "Practical ways to support and participate in Amaana Foundation's work.",
  },
};

const waysToHelp = [
  {
    number: "01",
    title: "Sponsor a student",
    copy: "Support Quran Nazira, Hifdh, or a child’s school or college education through the Amaana Taleem Initiative.",
    href: "/get-involved/sponsor-education",
    action: "Explore education sponsorship",
  },
  {
    number: "02",
    title: "Stand with a verified appeal",
    copy: "When a reviewed public need is active, you can understand the case first and decide whether you want to support it.",
    href: "/appeals",
    action: "See current appeals",
  },
  {
    number: "03",
    title: "Offer your time or skills",
    copy: "Packing, documentation, creative work, technology and field support can all matter. Availability depends on the needs of each initiative.",
    href: "/contact",
    action: "Talk to the team",
  },
  {
    number: "04",
    title: "Share the work responsibly",
    copy: "Help genuine initiatives reach people who may care, without exposing private beneficiary information or creating artificial urgency.",
    href: "/stories",
    action: "Explore stories to share",
  },
  {
    number: "05",
    title: "Help someone reach Amaana",
    copy: "If you know a person or family facing genuine hardship, guide them to the private assistance-request process rather than sharing their documents publicly.",
    href: "/request-assistance",
    action: "Request assistance",
  },
] as const;

export default async function GetInvolvedPage() {
  const heroMedia = await getGetInvolvedHeroMedia();

  return (
    <div className="v2-home">
      <PageHero
        variant="level1"
        eyebrow="Get Involved · Amaana Foundation"
        title="Bring what you can."
        description={<p>There is more than one way to stand with the work. Sponsor education, offer useful skills, share responsibly or help a genuine need reach Amaana.</p>}
        actions={[
          { label: "Sponsor education", href: "/get-involved/sponsor-education" },
          { label: "Connect with Amaana", href: "/contact", secondary: true },
        ]}
        visual={heroMedia ? <PublicMedia asset={heroMedia} priority /> : undefined}
        visualKicker="Five ways to take part"
        visualTitle="Time. Skills. Support. Care."
        visualNote="Choose a path that matches what you can offer and what the work needs now."
      />

      <section className="v2-intent" aria-labelledby="ways-to-help-title">
        <div className="v2-shell">
          <div className="v2-intent-heading"><div><p className="v2-section-label">Choose your way in</p><h2 id="ways-to-help-title">Different people can contribute differently.</h2></div><p>Start with what is realistic for you and what the current work actually needs.</p></div>
          <div className={`v2-intent-grid v2-intent-grid--five ${styles.intent}`}>
            {waysToHelp.map(item => <Link className="v2-intent-card" href={item.href} key={item.number} aria-label={`${item.title}: ${item.action}`}><span className="v2-intent-marker" aria-hidden="true">{item.number}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div><span className="v2-intent-arrow">{item.action} ↗</span></Link>)}
          </div>
        </div>
      </section>

      <section className="v2-section paper"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">A responsible way to participate</p><h2 className="v2-section-title">Dignity comes before visibility.</h2></div><p className="v2-section-intro">Amaana does not ask volunteers or supporters to circulate private records, identity documents, phone numbers or beneficiary details. Public stories and evidence should be shared only after the appropriate privacy review.</p></div><div className={`v2-journey ${styles.journey}`}><div className="v2-journey-step"><b>Understand</b><span>Read about the initiative or need before acting.</span></div><div className="v2-journey-step"><b>Ask</b><span>Check what help is actually useful at that moment.</span></div><div className="v2-journey-step"><b>Contribute</b><span>Offer time, skills, resources or financial support where appropriate.</span></div><div className="v2-journey-step"><b>Protect</b><span>Respect beneficiary privacy and avoid forwarding sensitive material.</span></div><div className="v2-journey-step"><b>Stay connected</b><span>Follow published updates and known outcomes.</span></div></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Start a conversation</p><h2>Tell us how you would like to help.</h2><p>Amaana can guide you toward what is useful, appropriate and currently needed.</p><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/contact">Contact Amaana</Link><Link className="v2-text-link" href="/our-work">Explore the work →</Link></div></div></section>
    </div>
  );
}
