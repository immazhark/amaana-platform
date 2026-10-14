import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { MonthlyGivingReminder } from "@/components/monthly-giving-reminder";

export const metadata: Metadata = {
  title: "Manual Monthly Giving Reminder",
  description: "Download a private monthly calendar reminder to review Amaana Foundation's currently approved domestic giving routes. No recurring charge is set up.",
  alternates: { canonical: "/get-involved/monthly-giving" },
  openGraph: {
    type: "website", title: "Monthly Giving Reminder | Amaana Foundation",
    description: "A personal reminder, never an automatic donation or subscription.",
    url: "/get-involved/monthly-giving",
  },
  twitter: { card: "summary_large_image", title: "Monthly Giving Reminder | Amaana Foundation" },
};
export default function MonthlyGivingPage() {
  return <div className="v2-home">
    <PageHero variant="information" eyebrow="Get Involved · Personal planning"
      title="Make room for giving. Keep full control."
      description={<p>Create a private monthly reminder to review current giving opportunities. Any contribution is always a separate voluntary decision made through Amaana’s approved donation routes.</p>}
      actions={[{ label: "Prepare reminder", href: "#giving-reminder" }, { label: "Review donation routes", href: "/donate", secondary: true }]}
      visualKicker="Your choice each month" visualTitle="A reminder is not a mandate."
      visualNote="No automatic debits · No active subscription · No stored donor profile"
    />
    <section className="v2-section paper" id="giving-reminder" aria-labelledby="giving-reminder-title">
      <div className="v2-shell">
        <SectionHeading id="giving-reminder-title" eyebrow="Optional personal calendar"
          title="A gentle reminder, never an automatic charge."
          subtitle="Download an all-day calendar event that repeats monthly. You choose if and when to contribute."/>
        <MonthlyGivingReminder/>
      </div>
    </section>
    <section className="v2-section amaana-bg-body">
      <div className="v2-shell">
        <SectionHeading eyebrow="Giving with intention" title="Review what is approved before each contribution."
          subtitle="Appeals can close and programme eligibility can change. An old reminder never reserves money or establishes current donation eligibility."/>
        <div className="v2-hero-actions">
          <Link className="v2-button" href="/donate">Review approved donation options</Link>
          <Link className="v2-text-link" href="/donation-policy">Donation policy →</Link>
        </div>
      </div>
    </section>
  </div>;
}
