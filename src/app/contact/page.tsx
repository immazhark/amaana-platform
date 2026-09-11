import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Amaana Foundation in Hyderabad, Telangana for general enquiries, assistance, volunteering, collaborations or donation support.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "Contact Amaana Foundation",
    description: "Reach Amaana Foundation in Hyderabad for general enquiries, assistance, volunteering, collaborations or donation support.",
  },
  twitter: {
    card: "summary",
    title: "Contact Amaana Foundation",
    description: "Choose the right contact path for Amaana Foundation in Hyderabad.",
  },
};

const contactPaths = [
  {
    marker: "01",
    title: "General enquiries",
    copy: "Questions about Amaana, its work, collaborations or other general matters can be sent to the foundation team.",
    action: "Email Amaana",
    href: "mailto:amaanafoundation24@gmail.com",
  },
  {
    marker: "02",
    title: "Request assistance",
    copy: "If you or someone you know needs support, use the dedicated private intake route so the request reaches the right review process.",
    action: "Request assistance",
    href: "/request-assistance",
  },
  {
    marker: "03",
    title: "Volunteer or collaborate",
    copy: "If you want to contribute time, skills, resources or explore a genuine collaboration, start with our Get Involved journey.",
    action: "Get involved",
    href: "/get-involved",
  },
  {
    marker: "04",
    title: "Donation support",
    copy: "For a payment or donation query, contact the team with your Amaana reference or Razorpay payment ID only. Never share PINs, OTPs or card credentials.",
    action: "Email donation support",
    href: "mailto:amaanafoundation24@gmail.com?subject=Donation%20support",
  },
] as const;

const socialLinks = [
  { label: "Instagram", handle: "@amaanafoundation", href: "https://www.instagram.com/amaanafoundation/" },
  { label: "Facebook", handle: "amaanafoundation24", href: "https://www.facebook.com/amaanafoundation24/" },
  { label: "YouTube", handle: "@amaanafoundation", href: "https://www.youtube.com/@amaanafoundation" },
] as const;

export default function ContactPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell v2-contact-hero">
          <div>
            <p className="v2-section-label">Contact Amaana</p>
            <h1 className="v2-display v2-display-narrow">Start with the right conversation.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">
              Whether you want to understand the work, request assistance, collaborate or resolve a donation query, choose the path that best matches why you are here.
            </p>
            <div className="v2-contact-location">
              <span>Based in</span>
              <strong>Hyderabad, Telangana, India</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Choose your path</p>
              <h2 className="v2-section-title">Reach the right part of the team.</h2>
            </div>
            <p className="v2-section-intro">
              Keeping enquiries separated helps Amaana respond responsibly while protecting private beneficiary information.
            </p>
          </div>

          <div className="v2-intent-grid">
            {contactPaths.map(path => (
              <Link className="v2-intent-card" href={path.href} key={path.marker} aria-label={`${path.title}: ${path.action}`}>
                <span className="v2-intent-marker" aria-hidden="true">{path.marker}</span>
                <div>
                  <h3>{path.title}</h3>
                  <p>{path.copy}</p>
                  <span className="v2-text-link">{path.action} →</span>
                </div>
                <span className="v2-intent-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-contact-social-section">
        <div className="v2-shell v2-contact-social-grid">
          <div>
            <p className="v2-section-label">Stay connected</p>
            <h2>Follow the work where Amaana shares it.</h2>
            <p>These public channels are the social identities shown in Amaana&apos;s supplied 2026 branded contact material. Instagram is also corroborated by recent public posts under the same handle.</p>
          </div>
          <div className="v2-contact-social-links">
            {socialLinks.map(link => (
              <a href={link.href} target="_blank" rel="noreferrer" key={link.label} aria-label={`Open Amaana Foundation on ${link.label} in a new tab`}>
                <span>{link.label}</span>
                <strong>{link.handle}</strong>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell v2-contact-safety">
          <div>
            <p className="v2-section-label">Privacy matters</p>
            <h2 className="v2-section-title">Sensitive documents do not belong in a general inbox.</h2>
          </div>
          <div className="v2-contact-safety-copy">
            <p>
              Medical reports, identity documents, bank information and other sensitive verification material should be submitted only through the approved assistance workflow or another channel specifically requested by an authorized Amaana team member.
            </p>
            <p>
              For payment support, a transaction reference may help the team investigate. Never send card numbers, UPI PINs, passwords or OTPs.
            </p>
            <Link className="v2-button" href="/request-assistance">Use the private assistance form</Link>
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Amaana Foundation</p>
          <h2>Listen first. Respond with care.</h2>
          <p>
            General enquiries can be sent to <a className="v2-text-link" href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a>.
          </p>
          <div className="v2-hero-actions v2-actions-center">
            <Link className="v2-button" href="/our-work">Explore our work</Link>
            <Link className="v2-text-link" href="/transparency">See how trust is handled →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
