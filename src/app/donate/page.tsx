import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";
import { getAppealsIndexData } from "@/lib/public-page-data";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { canExposeSyntheticStagingContent, isSyntheticStagingAppeal } from "@/lib/public-environment";
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

export const dynamic = "force-dynamic";

export default async function Page() {
  const appealRecords = await getAppealsIndexData();
  const isStaging = canExposeSyntheticStagingContent();
  const openAppeals = appealRecords.filter(appeal => isAppealOpenForDonations(appeal) && (isStaging || !isSyntheticStagingAppeal(appeal)));
  const hasOpenAppeals = openAppeals.length > 0;
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle="Give With Purpose"
      heroVisualNote={hasOpenAppeals ? "Choose a verified public appeal, explore Taleem sponsorship, or ask Amaana about a currently approved programme giving route." : "There is no active public appeal right now. Explore Taleem sponsorship or ask Amaana about a currently approved programme giving route."}
      title="Give With Confidence. Give With Purpose."
      intro={hasOpenAppeals ? "Every contribution is an amaana. Choose where your support should go: a specific verified appeal or a currently approved programme." : "Every contribution is an amaana. No public appeal is accepting donations right now, so choose an approved programme route or speak with Amaana before contributing."}
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
        <article className={styles.route}><span>Route 01</span><h3>{hasOpenAppeals ? "Support a verified public appeal" : "Public appeals"}</h3><p>{hasOpenAppeals ? `There ${openAppeals.length === 1 ? "is" : "are"} currently ${openAppeals.length} reviewed public ${openAppeals.length === 1 ? "appeal" : "appeals"} accepting support. Review the context and remaining verified target before continuing to secure domestic INR checkout.` : "No public appeal is accepting donations right now. Completed cases remain visible for accountability, and new urgent appeals appear only after review."}</p><Link className="v2-button" href="/appeals">{hasOpenAppeals ? "See verified appeals" : "View appeals and completed cases"}</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>Support education or another approved programme</h3><p>Taleem sponsorship and programme giving begin with the currently available programme route or a conversation with Amaana about an approved destination.</p><Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      <p className={styles.note}>Choose the route that matches your intention: an open appeal supports that specific published need, while programme support is available only when Amaana has confirmed an approved destination.</p>
    </CanonicalArticle>
  );
}
