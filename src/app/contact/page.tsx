import { ActionIcon } from "@/components/action-icon";
import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ParticipationCards } from "@/components/participation-card";
import { SocialIcon } from "@/components/social-icon";
import styles from "./contact-audit.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Amaana Foundation in Hyderabad, Telangana for general enquiries, assistance, volunteering, collaborations or donation support.",
  alternates: { canonical: "/contact" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
    type: "website",
    url: "/contact",
    title: "Contact Amaana Foundation",
    description: "Reach Amaana Foundation in Hyderabad for general enquiries, assistance, volunteering, collaborations or donation support.",
  },
  twitter: { images: ["/twitter-image"],
    card: "summary_large_image",
    title: "Contact Amaana Foundation",
    description: "Choose the right contact path for Amaana Foundation in Hyderabad.",
  },
};

const contactPaths = [
  { marker: "01", icon: "contact", title: "General enquiries", copy: "Questions about Amaana, its work, collaborations or other general matters can be sent to the foundation team.", action: "Email Amaana", href: "mailto:amaanafoundation24@gmail.com" },
  { marker: "02", icon: "phone", title: "Call Amaana", copy: "For a direct public contact route, call Amaana Foundation on its official phone number.", action: "+91-9908002694", href: "tel:+919908002694" },
  { marker: "02A", icon: "message", title: "WhatsApp Amaana", copy: "Prefer messaging? Start a WhatsApp conversation with Amaana Foundation on the same official public number.", action: "Open WhatsApp", href: "https://wa.me/919908002694" },
  { marker: "03", icon: "assistance", title: "Request assistance", copy: "If you or someone you know needs support, use the dedicated private intake route so the request reaches the right review process.", action: "Request assistance", href: "/request-assistance" },
  { marker: "04", icon: "volunteer", title: "Volunteer or collaborate", copy: "If you want to contribute time, skills, resources or explore a genuine collaboration, start with our Get Involved journey.", action: "Get involved", href: "/get-involved" },
  { marker: "05", icon: "support", title: "Donation support", copy: "For a payment or donation query, contact the team with your Amaana reference or Razorpay payment ID only. Never share PINs, OTPs or card credentials.", action: "Email donation support", href: "mailto:amaanafoundation24@gmail.com?subject=Donation%20support" },
] as const;

const socialLinks = [
  { network: "instagram", label: "Instagram", handle: "@amaanafoundation", href: "https://www.instagram.com/amaanafoundation/" },
  { network: "facebook", label: "Facebook", handle: "amaanafoundation24", href: "https://www.facebook.com/amaanafoundation24/" },
  { network: "youtube", label: "YouTube", handle: "@amaanafoundation", href: "https://www.youtube.com/@amaanafoundation" },
] as const;

export default function ContactPage() {
  return (
    <div className="v2-home">
      <PageHero
        variant="information"
        eyebrow="Contact Amaana · Hyderabad"
        title="Start with the right conversation."
        description={<p>Whether you want to understand the work, request assistance, collaborate or resolve a donation query, choose the path that best matches why you are here.</p>}
        actions={[
          { label: "Email Amaana", href: "mailto:amaanafoundation24@gmail.com" },
          { label: "Request assistance", href: "/request-assistance", secondary: true },
        ]}
        visualKicker="Based in"
        visualTitle="Hyderabad, Telangana"
        visualNote="General enquiries · assistance · volunteering · collaboration · donation support"
      />

      <section className="v2-section paper">
        <div className="v2-shell">
          <SectionHeading eyebrow={<>Choose your path</>} title={<>Reach the right part of the team.</>} subtitle={<>Keeping enquiries separated helps Amaana respond responsibly while protecting private beneficiary information.</>} />
          <ParticipationCards paths={contactPaths} />
        </div>
      </section>

      <section className={`v2-contact-social-section amaana-bg-body ${styles.socialSection}`}><div className={`v2-shell v2-contact-social-grid ${styles.socialGrid}`}><SectionHeading eyebrow="Stay connected" title="Follow the work where Amaana shares it." subtitle="Use Amaana Foundation’s official public channels for programme updates, campaign notices and documented community work." /><div className={`v2-contact-social-links ${styles.socialLinks}`}>{socialLinks.map(link => <a href={link.href} target="_blank" rel="noreferrer" key={link.label} aria-label={`${link.label} ${link.handle} — opens Amaana Foundation in a new tab`}><span className={styles.socialIcon}><SocialIcon network={link.network}/></span><span className={styles.socialCopy}><span>{link.label}</span><strong>{link.handle}</strong></span><i aria-hidden="true">↗</i></a>)}</div></div></section>

      <section className="v2-section paper"><div className={`v2-shell v2-contact-safety ${styles.privacy}`}><div><p className="v2-section-label">Privacy matters</p><h2 className="v2-section-title">Sensitive documents do not belong in a general inbox.</h2></div><div className="v2-contact-safety-copy"><p>Medical reports, identity documents, bank information and other sensitive verification material should be submitted only through the approved assistance workflow or another channel specifically requested by an authorized Amaana team member.</p><p>For payment support, a transaction reference may help the team investigate. Never send card numbers, UPI PINs, passwords or OTPs.</p><Link className="v2-button" href="/request-assistance">Use the private assistance form</Link></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Amaana Foundation</>} title={<>Listen first. Respond with care.</>} subtitle={<span className={styles.contactRoutes}><a href="mailto:amaanafoundation24@gmail.com"><ActionIcon kind="contact"/><span><small>Email Amaana</small>amaanafoundation24@gmail.com</span></a><a href="tel:+919908002694"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 3 3 5-2 2a14 14 0 0 0 6 6l2-2 5 3v3c-10 3-21-8-18-18z"/></svg><span><small>Call Amaana</small>+91-9908002694</span></a></span>} /><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/transparency">See how trust is handled →</Link></div></div></section>
    </div>
  );
}
