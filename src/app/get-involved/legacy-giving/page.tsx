import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
// Reuse site tokens and intrinsic grids to keep the static page CSS-budget neutral.
const columns: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))", gap: "1rem", padding: 0, listStyle: "none" };
const card: CSSProperties = { border: "1px solid rgb(18 34 57 / 14%)", borderRadius: ".8rem", padding: "clamp(1rem, 2vw, 1.5rem)", background: "var(--af-color-surface)", minWidth: 0 };
const ordinal: CSSProperties = { color: "var(--af-color-gold-ink)", fontWeight: 800, fontSize: ".8rem", letterSpacing: ".08em" };
const actions: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".85rem", marginTop: "1rem" };

export const metadata: Metadata = {
  title: "Legacy Giving Enquiries",
  description: "Explore a careful, non-transactional conversation about leaving a charitable legacy. Legal, religious, governance and acceptance checks apply before any commitment.",
  alternates: { canonical: "/get-involved/legacy-giving" },
  // This information is not a reviewed bequest product or donation appeal.
  // Keep discovery on-site, not indexed as legal/religious financial advice.
  robots: { index: false, follow: false, noarchive: true },
};

const steps = [
  { marker: "01", title: "Consider your intentions",
    text: "Reflect on the kinds of community support that matter to you. You are under no obligation to commit money or specify an amount." },
  { marker: "02", title: "Seek independent advice",
    text: "Consult appropriately qualified legal and, where relevant, religious advisers before drafting or amending any will or estate instruction. Amaana does not draft wills or determine inheritance entitlements." },
  { marker: "03", title: "Discuss charitable suitability",
    text: "Ask Amaana to confirm its current registration, governance, eligible activities and whether any proposed restricted purpose can be considered. An enquiry is not acceptance of a bequest." },
  { marker: "04", title: "Keep formal records private",
    text: "Use your adviser’s recommended secure process for legal documents. Do not upload a will, family records, identity documents or estate details through a public contact channel." },
] as const;

const principles = [
  { title: "Your family and obligations first",
    text: "A charitable intention should never replace independent consideration of family obligations, personal needs or applicable estate requirements." },
  { title: "No predetermined entitlement or benefit",
    text: "No religious ruling, legal outcome, tax deduction or charitable acceptance is promised by this informational page." },
  { title: "Independent governance review",
    text: "Any future legacy contribution would require appropriate documentation, donor-intent verification, governance approval and compliance checks when relevant." },
] as const;

export default function LegacyGivingPage() {
  return <div className="v2-home">
    <PageHero
      variant="information"
      eyebrow="Get involved · Future intentions"
      title="A legacy begins with care."
      description={<p>Some supporters think about charitable intentions for the future. This is a space to understand how to start a careful conversation — not an online bequest programme, payment commitment or substitute for legal advice.</p>}
      actions={[
        { label: "Understand the steps", href: "#legacy-process" },
        { label: "Talk to Amaana", href: "/contact", secondary: true },
      ]}
      visualKicker="A thoughtful conversation"
      visualTitle="Intentions without pressure."
      visualNote="No payment · No legal documents collected · No implied acceptance"
    />
    <section className="v2-section paper" aria-labelledby="legacy-process-title" id="legacy-process">
      <div className="v2-shell">
        <SectionHeading id="legacy-process-title" eyebrow="Before any decision"
          title="Four thoughtful steps."
          subtitle="There is no sign-up fee, donation checkout, pledge registration or deadline here. Start with clarity and independent advice."/>
        <ol style={columns}>
          {steps.map(step => <li style={card} key={step.marker}>
            <span style={ordinal} aria-hidden="true">{step.marker}</span>
            <div><h3>{step.title}</h3><p>{step.text}</p></div>
          </li>)}
        </ol>
      </div>
    </section>
    <section className="v2-section amaana-bg-body" aria-labelledby="legacy-principles-title">
      <div className="v2-shell">
        <SectionHeading id="legacy-principles-title" eyebrow="Respect and accountability"
          title="What this conversation does — and does not — mean."
          subtitle="A future intention deserves the same dignity, privacy and careful governance as any current contribution."/>
        <div style={columns}>
          {principles.map(principle => <article style={card} key={principle.title}>
            <h3>{principle.title}</h3><p>{principle.text}</p>
          </article>)}
        </div>
      </div>
    </section>
    <section className="v2-section paper" aria-labelledby="legacy-contact-title">
      <div className="v2-shell">
        <div style={card}>
          <div><p className="v2-section-label">No obligation</p>
            <h2 id="legacy-contact-title">Begin with a question, not a document.</h2>
            <p>If you would like to understand Amaana’s current charitable work and governance, contact the team without sending private financial, family or legal information. A response is informational and does not establish any entitlement or accepted commitment.</p>
          </div>
          <div style={actions}>
            <Link className="v2-button" href="/contact">Contact Amaana</Link>
            <Link className="v2-text-link" href="/governance">Review our governance →</Link>
            <Link className="v2-text-link" href="/compliance">Registration and compliance →</Link>
          </div>
        </div>
      </div>
    </section>
  </div>;
}
