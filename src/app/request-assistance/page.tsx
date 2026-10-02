import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { AssistanceForm } from "@/components/assistance-form";
import { PageHero } from "@/components/page-hero";
import styles from "./assistance-surface.module.css";

export const metadata: Metadata = {
  title: "Request Assistance",
  description: "Submit a private assistance request to Amaana Foundation in Hyderabad for careful review, verification and follow-up.",
  alternates: { canonical: "/request-assistance" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/request-assistance", title: "Request Assistance | Amaana Foundation", description: "Start a private assistance request with Amaana Foundation in Hyderabad. Requests begin with review, not public fundraising." },
  twitter: { images: ["/twitter-image"], card: "summary_large_image", title: "Request Assistance | Amaana Foundation", description: "A private first step for requesting assistance from Amaana Foundation." },
};

export default function RequestAssistancePage() {
  return <div className="v2-home v2-assistance-page">
    <PageHero variant="action" eyebrow="Request Assistance · Private First Step" title="Ask for Help Privately and With Dignity" description={<p>Tell Amaana what support is needed through a private request. Sensitive documents stay outside the public website while the team reviews the circumstances and follows up where needed.</p>} actions={[{label:"Begin your request",href:"#request-form"},{label:"Track an existing request",href:"/request-assistance/status",secondary:true}]} visualKicker="What happens here" visualTitle="Private Request → Human Review" visualNote="A request begins review; it does not guarantee assistance, fundraising or public publication." />

    <section className={`v2-assistance-before ${styles.before}`}><div className="v2-shell"><SectionHeading eyebrow="Before you begin" title="Share what helps us understand the need." subtitle={<>Describe the situation and the support requested. Add supporting documents only when they genuinely help verification.<span className={styles.privacy}><strong>Uploads remain private.</strong> Any later public sharing would require a separate reviewed decision.</span></>} /></div></section>

    <section className="v2-section paper" id="request-form" aria-labelledby="assistance-form-heading"><div className="v2-shell v2-assistance-form-layout"><aside><p className="v2-section-label">Your request</p><h2>One careful step at a time.</h2><ol><li><span>01</span><p><strong>Contact</strong>Your basic details so the team can reach you.</p></li><li><span>02</span><p><strong>Need</strong>What kind of assistance is being requested.</p></li><li><span>03</span><p><strong>Supporting evidence</strong>Optional private documents that help verification.</p></li><li><span>04</span><p><strong>Confirm</strong>Review the declaration before secure submission.</p></li></ol></aside><AssistanceForm /></div></section>

    <section className="v2-assistance-after amaana-bg-body"><div className="v2-shell"><SectionHeading eyebrow={<>After submission</>} title={<>Reference. Review. Follow-up.</>} subtitle={<>A successful submission gives you a tracking reference. Amaana then reviews the information and contacts you if clarification is needed.</>} /><div className="v2-assistance-after-flow"><div><span>01</span><strong>Received</strong></div><div><span>02</span><strong>Reviewed</strong></div><div><span>03</span><strong>Follow-up if needed</strong></div><div><span>04</span><strong>Decision communicated</strong></div></div><p className="v2-assistance-note"><Link href="/how-we-verify">See how requests are reviewed →</Link></p></div></section>
  </div>;
}
