import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";
import { getAppealsIndexData, getDonationPageData } from "@/lib/public-page-data";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { AppealLandingCheckout, type ReviewedAppealChoice } from "@/components/appeal-landing-checkout";
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

// Checkout eligibility and reviewed appeal balances must be re-read per visit.
export const dynamic = "force-dynamic";

export default async function Page() {
  const appealRecords = await getAppealsIndexData();
  const isStaging = canExposeSyntheticStagingContent();
  const openAppeals = appealRecords.filter(appeal => isAppealOpenForDonations(appeal) && (isStaging || !isSyntheticStagingAppeal(appeal)));
  // A public listing does not grant checkout permission. Validate each
  // proposed destination with the full donation approval projection.
  const verifiedCandidates = await Promise.all(openAppeals.slice(0, 4).map(async record => {
    const appeal = await getDonationPageData(record.slug);
    if (!appeal) return null;
    const remaining = getDonationCheckoutRemainingAmount(appeal);
    if (remaining === null) return null;
    return { id: appeal.id, slug: appeal.slug, title: appeal.title,
      maxAmount: remaining, zakatEligible: appeal.zakatEligible } satisfies ReviewedAppealChoice;
  }));
  const eligibleChoices: ReviewedAppealChoice[] = verifiedCandidates.filter(
    (item): item is ReviewedAppealChoice => item !== null,
  );
  const hasOpenAppeals = eligibleChoices.length > 0;
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle={hasOpenAppeals ? "Give With Purpose" : "Support Responsibly"}
      heroVisualNote={hasOpenAppeals ? "Choose a verified public appeal, explore Taleem sponsorship, or ask Amaana about a currently approved programme giving route." : "There is no active public appeal right now. Explore Taleem sponsorship or ask Amaana about a currently approved programme giving route."}
      title={hasOpenAppeals ? "Give With Confidence. Give With Purpose." : "Find an Approved Way to Support."}
      intro={hasOpenAppeals ? "Every contribution is an amaana. Choose where your support should go: a specific verified appeal or a currently approved programme." : "Every contribution is an amaana. No public appeal is accepting donations right now, so choose an approved programme route or speak with Amaana before contributing."}
      blocks={[
        {
          title: "Choose where your support should go.",
          presentation: "default",
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
      <div className={styles.routes} role="group" aria-label="Donation routes">
        <article className={styles.route}><span>Route 01</span><h3>{hasOpenAppeals ? "Support a verified public appeal" : "Public appeals"}</h3><p>{hasOpenAppeals ? `There ${eligibleChoices.length === 1 ? "is" : "are"} currently ${eligibleChoices.length} reviewed public ${eligibleChoices.length === 1 ? "appeal" : "appeals"} accepting support. Review the context and remaining verified target before continuing to secure domestic INR checkout.` : "No public appeal is accepting donations right now. Completed cases remain visible for accountability, and new urgent appeals appear only after review."}</p><Link className="v2-button" href="/appeals">{hasOpenAppeals ? "See verified appeals" : "View appeals and completed cases"}</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>Support education or another approved programme</h3><p>Taleem sponsorship and programme giving begin with the currently available programme route or a conversation with Amaana about an approved destination.</p><Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      {eligibleChoices.length > 0 && <AppealLandingCheckout appeals={eligibleChoices} paymentDetails={getDonationPaymentDetails()} />}
      <p className={styles.note}>Choose the route that matches your intention: an open appeal supports that specific published need, while programme support is available only when Amaana has confirmed an approved destination.</p>
    </CanonicalArticle>
  );
}
