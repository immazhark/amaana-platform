import type { Metadata } from "next";
import Link from "next/link";
import { AssistanceForm } from "@/components/assistance-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Request Assistance",
  description: "Submit a private assistance request to Amaana Foundation in Hyderabad for careful review, verification and follow-up.",
  alternates: { canonical: "/request-assistance" },
  openGraph: { type: "website", url: "/request-assistance", title: "Request Assistance | Amaana Foundation", description: "Start a private assistance request with Amaana Foundation in Hyderabad. Requests begin with review, not public fundraising." },
  twitter: { card: "summary", title: "Request Assistance | Amaana Foundation", description: "A private first step for requesting assistance from Amaana Foundation." },
};

export default function RequestAssistancePage() {
  return <div className="v2-home v2-assistance-page">
    <PageHero variant="action" eyebrow="Request Assistance · Private First Step" title="Ask for Help Privately and With Dignity" description={<p>Seeking assistance can already be difficult. Amaana’s request process makes it possible for a person or family to explain a genuine need without being forced to share sensitive information publicly.</p>} actions={[{label:"Begin your request",href:"#request-form"},{label:"Track an existing request",href:"/request-assistance/status",secondary:true}]} visualKicker="What happens here" visualTitle="Private Request → Human Review" visualNote="Verification follows before a responsible decision. Submission does not guarantee assistance or publication." />

    <section className="v2-assistance-before"><div className="v2-shell"><p className="v2-section-label">Before you begin</p><div className="v2-assistance-before-grid"><h2>Share enough to help us understand. Keep sensitive material relevant.</h2><div><p>Describe the situation, the support needed and any useful context. Supporting documents can be added when they genuinely help verification.</p><p><strong>Your uploaded documents remain private.</strong> Public sharing, if ever considered later, is a separate reviewed decision.</p></div></div></div></section>

    <section className="v2-section paper" id="request-form" aria-labelledby="assistance-form-heading"><div className="v2-shell v2-assistance-form-layout"><aside><p className="v2-section-label">Your request</p><h2>One careful step at a time.</h2><ol><li><span>01</span><p><strong>Contact</strong>Your basic details so the team can reach you.</p></li><li><span>02</span><p><strong>Need</strong>What kind of assistance is being requested.</p></li><li><span>03</span><p><strong>Context</strong>A clear description in your own words.</p></li><li><span>04</span><p><strong>Evidence</strong>Optional supporting files for private review.</p></li></ol></aside><AssistanceForm /></div></section>

    <section className="v2-assistance-after"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">After submission</p><h2 className="v2-section-title">A reference, then review.</h2></div><p className="v2-section-intro">You receive a tracking reference after a successful submission. The team can then review the request and follow up where needed.</p></div><div className="v2-assistance-after-flow"><div><span>01</span><strong>Request received</strong></div><div><span>02</span><strong>Information reviewed</strong></div><div><span>03</span><strong>Follow-up if needed</strong></div><div><span>04</span><strong>Decision communicated</strong></div></div><p className="v2-assistance-note">Need to understand Amaana&apos;s process first? <Link href="/how-we-verify">See how requests are reviewed →</Link></p></div></section>
  </div>;
}
