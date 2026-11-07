import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { formatINR } from "@/lib/appeals";
import { mrKhajaPublicInformation as info } from "@/lib/mr-khaja-public-information";

export const metadata: Metadata = {
  title: "Mr. Khaja — Family Medical Support Request",
  description: info.summary,
  alternates: { canonical: info.path },
  openGraph: {
    type: "article",
    url: info.path,
    title: info.title + " | Amaana Foundation",
    description: info.summary,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
  },
  twitter: { card: "summary_large_image", title: info.title, description: info.summary },
};

export default function MrKhajaPublicInformationPage() {
  return <main className="v2-home">
    <PageHero
      variant="level2"
      className="page-hero--long-title"
      eyebrow="Family medical assistance request · Hyderabad"
      title={info.title}
      description={<p>{info.summary}</p>}
      actions={[
        { label: "Enquire about support in India", href: "/contact" },
        { label: "Browse reviewed appeals", href: "/appeals", secondary: true },
      ]}
      visual={<WorkVisualPlaceholder label="Support with dignity" />}
    />
    <section className="v2-section paper" aria-labelledby="khaja-story-heading">
      <div className="v2-shell">
        <p className="v2-section-label">The family's account</p>
        <h2 className="v2-section-title" id="khaja-story-heading">Supporting treatment and recovery</h2>
        {info.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </section>
    <section className="v2-section" aria-labelledby="khaja-request-heading">
      <div className="v2-shell">
        <p className="v2-section-label">Assistance requested by the family</p>
        <h2 className="v2-section-title" id="khaja-request-heading">{formatINR(info.requestedINR)} requested</h2>
        <p>{info.evidenceNotice}</p>
        <p><strong>India-only support:</strong> {info.paymentNotice}</p>
        <p>Privacy: only the approved short name is used. Private clinical documents and identifiable contact details are not published on this page.</p>
        <div className="v2-hero-actions">
          <Link className="v2-button" href="/contact">Contact Amaana about this request</Link>
          <Link className="v2-text-link" href="/how-we-verify">How verification works</Link>
        </div>
      </div>
    </section>
  </main>;
}
