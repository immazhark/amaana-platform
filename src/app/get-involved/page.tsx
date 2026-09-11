import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Ways to support, follow and participate in Amaana Foundation’s work in Hyderabad through verified appeals, volunteering, responsible sharing and assistance referrals.",
  alternates: { canonical: "/get-involved" },
  openGraph: {
    type: "website",
    url: "/get-involved",
    title: "Get Involved | Amaana Foundation",
    description: "Support Amaana through verified appeals, volunteering, responsible sharing and assistance referrals.",
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
    title: "Stand with a verified appeal",
    copy: "When a reviewed public need is active, you can understand the case first and decide whether you want to support it.",
    href: "/appeals",
    action: "See current appeals",
  },
  {
    number: "02",
    title: "Offer your time or skills",
    copy: "Packing, documentation, creative work, technology and field support can all matter. Availability depends on the needs of each initiative.",
    href: "/contact",
    action: "Talk to the team",
  },
  {
    number: "03",
    title: "Share the work responsibly",
    copy: "Help genuine initiatives reach people who may care, without exposing private beneficiary information or creating artificial urgency.",
    href: "/stories",
    action: "Explore stories to share",
  },
  {
    number: "04",
    title: "Help someone reach Amaana",
    copy: "If you know a person or family facing genuine hardship, guide them to the private assistance-request process rather than sharing their documents publicly.",
    href: "/request-assistance",
    action: "Request assistance",
  },
] as const;

export default function GetInvolvedPage() {
  return (
    <div className="v2-home">
      <section className="v2-hero">
        <div className="v2-shell v2-hero-inner">
          <div>
            <p className="v2-kicker">Get involved</p>
            <h1 className="v2-display">Bring what you can.</h1>
          </div>
          <div>
            <p className="v2-hero-copy">Supporting good work is not limited to making a payment. Time, skills, responsible sharing and helping a genuine need reach the right place can all be part of the amanah.</p>
            <div className="v2-hero-actions">
              <Link className="v2-button" href="/appeals">See verified appeals</Link>
              <Link className="v2-button ghost" href="/contact">Connect with Amaana</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-intent" aria-labelledby="ways-to-help-title">
        <div className="v2-shell">
          <div className="v2-intent-heading">
            <div>
              <p className="v2-section-label">Choose your way in</p>
              <h2 id="ways-to-help-title">Different people can contribute differently.</h2>
            </div>
            <p>There is no pressure to choose the financial route. Start with what is realistic for you and what the current work actually needs.</p>
          </div>
          <div className="v2-intent-grid">
            {waysToHelp.map(item => (
              <Link className="v2-intent-card" href={item.href} key={item.number}>
                <span className="v2-intent-marker" aria-hidden="true">{item.number}</span>
                <div><h3>{item.title}</h3><p>{item.copy}</p></div>
                <span className="v2-intent-arrow">{item.action} ↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">A responsible way to participate</p>
              <h2 className="v2-section-title">Dignity comes before visibility.</h2>
            </div>
            <p className="v2-section-intro">Amaana does not ask volunteers or supporters to circulate private medical records, identity documents, phone numbers or beneficiary details. Public stories and evidence should be shared only after the appropriate privacy review.</p>
          </div>
          <div className="v2-journey">
            <div className="v2-journey-step"><b>Understand</b><span>Read about the initiative or need before acting.</span></div>
            <div className="v2-journey-step"><b>Ask</b><span>Check what help is actually useful at that moment.</span></div>
            <div className="v2-journey-step"><b>Contribute</b><span>Offer time, skills, resources or financial support where appropriate.</span></div>
            <div className="v2-journey-step"><b>Protect</b><span>Respect beneficiary privacy and avoid forwarding sensitive material.</span></div>
            <div className="v2-journey-step"><b>Stay connected</b><span>Follow published updates and known outcomes.</span></div>
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Start a conversation</p>
          <h2>Tell us how you would like to help.</h2>
          <p>Amaana can then guide you toward what is useful, appropriate and currently needed.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/contact">Contact Amaana</Link>
            <Link className="v2-text-link" href="/our-work">Explore the work →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
