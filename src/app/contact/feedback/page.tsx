import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { FeedbackEnquiryBuilder } from "@/components/feedback-enquiry-builder";

export const metadata: Metadata = {
  title: "Feedback and Concerns",
  description: "Privately share a concern, complaint, suggestion or appreciation with Amaana Foundation. Feedback never authorizes public testimonial publication.",
  alternates: { canonical: "/contact/feedback" },
  openGraph: {
    type: "website", title: "Feedback and Concerns | Amaana Foundation",
    description: "A voluntary, privacy-conscious path for complaints, improvements and private feedback.",
    url: "/contact/feedback",
  },
  twitter: { card: "summary_large_image", title: "Feedback and Concerns | Amaana Foundation" },
};

export default function FeedbackPage() {
  return <div className="v2-home">
    <PageHero variant="information" eyebrow="Listening · Privacy · Accountability"
      title="Your concerns deserve a respectful hearing."
      description={<p>Tell Amaana what could be improved, raise a concern about your experience or share appreciation privately. Neither receiving help nor offering support requires a review or testimonial.</p>}
      actions={[
        { label: "Prepare feedback", href: "#feedback-enquiry" },
        { label: "Other contact paths", href: "/contact", secondary: true },
      ]}
      visualKicker="A safer conversation"
      visualTitle="Feedback without pressure."
      visualNote="Complaints are welcome · No public testimonials without separate permission"
    />
    <section className="v2-section paper" id="feedback-enquiry" aria-labelledby="feedback-title">
      <div className="v2-shell">
        <SectionHeading id="feedback-title" eyebrow="Send feedback privately"
          title="Choose the right conversation."
          subtitle="This page prepares an email; it does not store a report, create an account or publish your words."/>
        <FeedbackEnquiryBuilder/>
      </div>
    </section>
    <section className="v2-section amaana-bg-body">
      <div className="v2-shell">
        <SectionHeading eyebrow="Important boundaries" title="Assistance is never conditional on positive feedback."
          subtitle="Amaana does not publish unsolicited praise, names, beneficiary stories or complaints. Any future public testimonial would require a separate, clear, revocable permission and review."/>
        <div className="v2-hero-actions">
          <Link className="v2-button" href="/request-assistance">Request assistance privately</Link>
          <Link className="v2-text-link" href="/privacy">Read our privacy policy →</Link>
        </div>
      </div>
    </section>
  </div>;
}
