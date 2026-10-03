import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { getGetInvolvedHeroMedia } from "@/lib/get-involved-media";
import { ParticipationCards } from "@/components/participation-card";
import styles from "./get-involved-audit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Ways to support, follow and participate in Amaana Foundation’s work in Hyderabad, including education sponsorship through the Amaana Taleem Initiative.",
  alternates: { canonical: "/get-involved" },
  openGraph: {
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
    type: "website",
    url: "/get-involved",
    title: "Get Involved | Amaana Foundation",
    description: "Support Amaana through education sponsorship, verified appeals, volunteering, responsible sharing and assistance referrals.",
  },
  twitter: {
    images: ["/twitter-image"],
    card: "summary_large_image",
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

      <section className="v2-intent amaana-bg-body" aria-labelledby="ways-to-help-title">
        <div className="v2-shell">
          <SectionHeading eyebrow={<>Choose your way in</>} title={<>Different people can contribute differently.</>} subtitle={<>Start with what is realistic for you and what the current work actually needs.</>} id="ways-to-help-title" />
          <ParticipationCards paths={waysToHelp.map(({ number, ...item }) => ({ ...item, marker: number }))} />
        </div>
      </section>

      <section className="v2-section paper"><div className="v2-shell"><SectionHeading eyebrow={<>A responsible way to participate</>} title={<>Dignity comes before visibility.</>} subtitle={<>Amaana does not ask volunteers or supporters to circulate private records, identity documents, phone numbers or beneficiary details. Public stories and evidence should be shared only after the appropriate privacy review.</>} /><div className={`v2-journey ${styles.journey}`}><div className="v2-journey-step"><b>Understand</b><span>Read about the initiative or need before acting.</span></div><div className="v2-journey-step"><b>Ask</b><span>Check what help is actually useful at that moment.</span></div><div className="v2-journey-step"><b>Contribute</b><span>Offer time, skills, resources or financial support where appropriate.</span></div><div className="v2-journey-step"><b>Protect</b><span>Respect beneficiary privacy and avoid forwarding sensitive material.</span></div><div className="v2-journey-step"><b>Stay connected</b><span>Follow published updates and known outcomes.</span></div></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Start a conversation</>} title={<>Tell us how you would like to help.</>} subtitle={<>Amaana can guide you toward what is useful, appropriate and currently needed.</>} /><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/contact">Contact Amaana</Link><Link className="v2-text-link" href="/our-work">Explore the work →</Link></div></div></section>
    </div>
  );
}
