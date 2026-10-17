import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { VolunteerInterestBuilder } from "@/components/volunteer-interest-builder";

export const metadata: Metadata = {
  title: "Volunteer With Amaana",
  description: "Offer your time, skills or event support responsibly to Amaana Foundation in Hyderabad. Enquire about current needs without submitting private records.",
  alternates: { canonical: "/get-involved/volunteer" },
  openGraph: {
    type: "website",
    title: "Volunteer With Amaana Foundation",
    description: "Explore practical ways to contribute with dignity, privacy and safeguarding.",
    url: "/get-involved/volunteer",
  },
  twitter: { card: "summary_large_image", title: "Volunteer With Amaana Foundation" },
};

export default function VolunteerPage() {
  return <div className="v2-home">
    <PageHero variant="level2" eyebrow="Get Involved · Volunteering"
      title="Your time and skills can matter."
      description={<p>Amaana welcomes thoughtful enquiries from people who can help with distribution, documentation, technology or community logistics. Actual involvement depends on verified initiative needs.</p>}
      actions={[
        { label: "Explore how you can help", href: "#volunteer-interest" },
        { label: "Explore our work", href: "/our-work", secondary: true },
      ]}
      visualKicker="Serve with care"
      visualTitle="Useful help. Respectful action."
      visualNote="A conversation first · Safeguarding and consent always"
    />
    <section className="v2-section paper" id="volunteer-interest" aria-labelledby="volunteer-title">
      <div className="v2-shell">
        <SectionHeading id="volunteer-title" eyebrow="Offer what you can"
          title="Tell us where you may be able to help."
          subtitle="Start with non-sensitive interests and general availability. This is an enquiry, not an application to access beneficiary information."/>
        <VolunteerInterestBuilder/>
      </div>
    </section>
    <section className="v2-section amaana-bg-body">
      <div className="v2-shell">
        <SectionHeading eyebrow="Volunteer responsibly"
          title="Protect dignity at every step."
          subtitle="Amaana coordinates participation around real programme needs; no beneficiary records, distribution addresses or private case details are made public through this route."/>
        <div className="v2-hero-actions">
          <Link href="/how-we-verify" className="v2-button">Understand how we verify</Link>
          <Link href="/contact" className="v2-text-link">Other questions or collaborations →</Link>
        </div>
      </div>
    </section>
  </div>;
}
