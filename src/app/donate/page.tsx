import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";
import styles from "./donate-audit.module.css";

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
      <div className={styles.routes} aria-label="Donation routes">
        <article className={styles.route}><span>Route 01</span><h3>Support a verified public appeal</h3><p>Choose a specific published need, review the context and remaining verified target, then continue to the secure domestic INR checkout.</p><Link className="v2-button" href="/appeals">See verified appeals</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>Support education or another approved programme</h3><p>Taleem sponsorship and programme giving begin with the currently available programme route or a conversation with Amaana about an approved destination.</p><Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      <p className={styles.note}>These are distinct giving routes: public appeals are specific verified needs; programme support is arranged only where Amaana confirms an available approved destination.</p>
    </CanonicalArticle>
  );
}
