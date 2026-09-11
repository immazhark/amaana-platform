import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How We Verify",
  description: "Understand Amaana Foundation’s assistance review and appeal-verification process, including privacy boundaries before public fundraising.",
  alternates: { canonical: "/how-we-verify" },
  openGraph: {
    type: "website",
    url: "/how-we-verify",
    title: "How We Verify | Amaana Foundation",
    description: "Understand how Amaana reviews assistance requests before a public appeal is approved.",
  },
  twitter: {
    card: "summary",
    title: "How We Verify | Amaana Foundation",
    description: "A clear view of Amaana Foundation's review, privacy and publication process.",
  },
};

const steps = [
  ["01", "Initial request", "We collect contact details, a clear description of the need and consent to conduct verification."],
  ["02", "Supporting information", "Relevant documents may be requested depending on the case. These records remain private and are available only to authorized reviewers."],
  ["03", "Personal review", "The team checks the supplied information, follows up with the applicant and may seek independent confirmation where appropriate."],
  ["04", "Decision", "A request may be approved, declined, closed or returned for more information. Approval for assistance does not automatically mean public publication."],
  ["05", "Publication approval", "A public appeal uses only approved information. Sensitive documents stay private, and designated approval is required before publication."],
] as const;

export default function VerificationPage() {
  return <div className="v2-home v2-verify-page">
    <section className="v2-verify-hero"><div className="v2-shell v2-verify-hero-grid"><div><p className="v2-section-label">Responsible giving begins before fundraising</p><h1>Trust is built<br />before an appeal<br />goes public.</h1><p>Verification is designed to reduce risk, protect donor trust and treat applicants with dignity. It is a human review process — not a promise that uncertainty disappears.</p><div className="v2-hero-actions"><a className="v2-button" href="#verification-path">Follow the process</a><Link className="v2-text-link" href="/request-assistance">Request assistance →</Link></div></div><div className="v2-verify-signal" aria-hidden="true"><span>Request</span><i /><span>Review</span><i /><span>Decision</span><i /><span>Publication</span></div></div></section>

    <section className="v2-verify-principle"><div className="v2-shell"><span>One principle</span><blockquote>Verification should reveal enough to establish trust without exposing the person who asked for help.</blockquote></div></section>

    <section className="v2-section paper" id="verification-path"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">The verification path</p><h2 className="v2-section-title">Five gates before public fundraising.</h2></div><p className="v2-section-intro">Not every request becomes an appeal. Each stage narrows what is known, what still needs checking and what may be safely shared.</p></div><div className="v2-verify-steps">{steps.map(([number,title,copy])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div></section>

    <section className="v2-section dark v2-verify-boundary"><div className="v2-shell v2-verify-boundary-grid"><div><p className="v2-section-label">The privacy boundary</p><h2 className="v2-section-title">What we verify is not the same as what we publish.</h2><p className="v2-section-intro">Identity documents, medical records, financial proofs, private contact details and other verification material remain protected even when a public-safe appeal is approved.</p></div><div className="v2-verify-split"><div><span>Private review</span><ul><li>Supporting documents</li><li>Personal contact details</li><li>Medical or financial proofs</li><li>Internal reviewer notes</li></ul></div><div><span>Public-safe record</span><ul><li>Approved explanation of need</li><li>Non-sensitive context</li><li>Funding progress</li><li>Known updates and outcomes</li></ul></div></div></div></section>

    <section className="v2-section v2-verify-reality"><div className="v2-shell v2-verify-reality-grid"><div><p className="v2-section-label">What verification can — and cannot — do</p><h2 className="v2-section-title">Careful review reduces risk. It does not erase it.</h2></div><div><p>Verification can test consistency, request evidence, follow up with applicants and add independent checks where appropriate.</p><p>It cannot eliminate every possibility of error, changed circumstances or misrepresentation. Amaana therefore presents verification as a risk-reduction process, not an absolute guarantee.</p></div></div></section>

    <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">From verification to evidence</p><h2>Trust should remain visible after the appeal is published.</h2><p>Continue into Amaana&apos;s transparency approach to see how public evidence, updates and privacy boundaries fit together.</p><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/transparency">Explore transparency</Link><Link className="v2-text-link" href="/appeals">View appeals →</Link></div></div></section>
  </div>;
}
