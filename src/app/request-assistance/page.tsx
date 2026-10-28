import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { AssistanceForm } from "@/components/assistance-form";
import { PageHero } from "@/components/page-hero";
import styles from "./assistance-surface.module.css";
import formStyles from "@/components/assistance-form.module.css";

export const metadata: Metadata = {
  title: "Request Assistance",
  description: "Submit a private assistance request to Amaana Foundation in Hyderabad for careful review, verification and follow-up.",
  alternates: { canonical: "/request-assistance" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/request-assistance", title: "Request Assistance | Amaana Foundation", description: "Start a private assistance request with Amaana Foundation in Hyderabad. Requests begin with review, not public fundraising." },
  twitter: { images: ["/twitter-image"], card: "summary_large_image", title: "Request Assistance | Amaana Foundation", description: "A private first step for requesting assistance from Amaana Foundation." },
};

const assistanceCopy = {
  heading: <div className="v2-form-heading"><span>Private submission</span><h2 id="assistance-form-heading">Tell us about the request.</h2><p id="assistance-form-description">Fields marked as required help the team identify and review the request. Optional information can be left out.</p></div>,
  descriptionHelp: <small id="description-help">40–5,000 characters. Please avoid unrelated sensitive information, passwords, OTPs or full banking credentials.</small>,
  evidenceInstructions: <><strong>Add private supporting files</strong><span>PDF, JPG, PNG or WEBP · up to 5 files · maximum 5 MB each</span><span className="v2-file-cta">Choose files securely</span></>,
  evidenceHelp: <small id="documents-help">Documents are used for private verification and administration. Uploading a document does not give Amaana permission to publish it.</small>,
  privacyNote: <p className={formStyles.privacyNote}>Your request and supporting documents remain private by default. Public use of identity, photographs or sensitive circumstances is a separate reviewed decision.</p>,
  consentHelp: <small id="assistance-consent-help">I understand that submission does not guarantee assistance or public fundraising, and that Amaana may request further information to verify the need. Public use of a name, photograph or sensitive story details requires a separate decision and consent review.</small>,
  termsNotice: <p className="muted">Before submitting, please review the <a href="/terms" target="_blank" rel="noreferrer">assistance and platform terms<span className="sr-only"> (opens in a new tab)</span></a> and <a href="/privacy" target="_blank" rel="noreferrer">privacy notice<span className="sr-only"> (opens in a new tab)</span></a>.</p>,
};

export default function RequestAssistancePage() {
  return <div className="v2-home v2-assistance-page">
    <PageHero variant="action" eyebrow="Request Assistance · Private First Step" title="Ask for Help Privately and With Dignity" description={<p>Tell Amaana what support is needed through a private request. Sensitive documents stay outside the public website while the team reviews the circumstances and follows up where needed.</p>} actions={[{label:"Begin your request",href:"#request-form"},{label:"Track an existing request",href:"/request-assistance/status",secondary:true}]} visualKicker="What happens here" visualTitle="Private Request → Human Review" visualNote="A request begins review; it does not guarantee assistance, fundraising or public publication." />

    <section className={`v2-assistance-before ${styles.before}`}><div className="v2-shell"><SectionHeading eyebrow="Before you begin" title="Share what helps us understand the need." subtitle={<>Describe the situation and the support requested. Add supporting documents only when they genuinely help verification.<span className={styles.privacy}><strong>Uploads remain private.</strong> Any later public sharing would require a separate reviewed decision.</span></>} /></div></section>

    <section className="v2-section paper" id="request-form" aria-labelledby="assistance-form-heading"><div className="v2-shell v2-assistance-form-layout"><aside><p className="v2-section-label">Your request</p><h2>One careful step at a time.</h2><ol><li><span>01</span><p><strong>Contact</strong>Your basic details so the team can reach you.</p></li><li><span>02</span><p><strong>Need</strong>What kind of assistance is being requested.</p></li><li><span>03</span><p><strong>Supporting evidence</strong>Optional private documents that help verification.</p></li><li><span>04</span><p><strong>Confirm</strong>Review the declaration before secure submission.</p></li></ol></aside><AssistanceForm copy={assistanceCopy} /></div></section>

    <section className="v2-assistance-after amaana-bg-body"><div className="v2-shell"><SectionHeading eyebrow={<>After submission</>} title={<>Reference. Review. Follow-up.</>} subtitle={<>A successful submission gives you a tracking reference. Amaana then reviews the information and contacts you if clarification is needed.</>} /><div className={`v2-assistance-after-flow ${styles.afterFlow}`}><div><span>01</span><strong>Received</strong></div><div><span>02</span><strong>Reviewed</strong></div><div><span>03</span><strong>Follow-up if needed</strong></div><div><span>04</span><strong>Decision communicated</strong></div></div><p className="v2-assistance-note"><Link href="/how-we-verify">See how requests are reviewed →</Link></p></div></section>
  </div>;
}
