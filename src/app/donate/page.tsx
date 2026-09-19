import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";

const description = "Support a verified appeal or Amaana initiative through currently approved domestic donation options.";

export const metadata: Metadata = {
  title: "Domestic Donations",
  description,
  alternates: { canonical: "/donate" },
  openGraph: {
    type: "website",
    url: "/donate",
    title: "Support Amaana Foundation | Domestic Donations",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation — Give With Purpose" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Amaana Foundation | Domestic Donations",
    description,
    images: [{ url: "/twitter-image", alt: "Amaana Foundation — Give With Purpose" }],
  },
};

export default function Page() {
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle="Give With Purpose"
      heroVisualNote="Choose a verified public appeal, explore Taleem sponsorship, or ask Amaana about a currently approved programme giving route."
      title="Give With Confidence. Give With Purpose."
      intro="Every contribution is an amaana. Choose where your support should go: a specific verified appeal or a currently approved programme."
      blocks={[
        {
          title: "Choose where your support should go.",
          paragraphs: [
            "Support an active verified need, enquire about an ongoing programme such as Taleem or seasonal relief, or explore the work behind completed cases. Programme contributions and general giving are arranged only when Amaana confirms an available approved destination.",
          ],
        },
        {
          title: "Domestic donations only",
          paragraphs: [complianceCopy.domestic, complianceCopy.tax],
        },
      ]}
    >
      <div className="v2-hero-actions">
        <Link className="v2-button" href="/appeals">Support a Verified Appeal</Link>
        <Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem Sponsorship</Link>
        <Link className="v2-text-link" href="/contact">Ask About Programme Giving →</Link>
      </div>
    </CanonicalArticle>
  );
}
