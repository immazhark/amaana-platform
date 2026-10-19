import type { Metadata } from "next";
import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";
import { getAppealsIndexData, getReviewedDonationPageData, getDonationImpactHighlights } from "@/lib/public-page-data";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { AppealLandingCheckout, type ReviewedAppealChoice } from "@/components/donation-methods";
import { donationFormCopy } from "@/components/donation-form-copy";
import { VerifiedImpactStrip, type VerifiedImpactItem } from "@/components/verified-impact-strip";
import { logServerError } from "@/lib/server-log";
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

// Always recheck current checkout eligibility and verified balances per request.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [appealRecords, publishedInitiatives] = await Promise.all([
    getAppealsIndexData(),
    getDonationImpactHighlights().catch(error => {
      logServerError("donation.published_impact_unavailable", {
        errorName: error instanceof Error ? error.name : "unknown",
      });
      return [];
    }),
  ]);
  const impactItems: VerifiedImpactItem[] = publishedInitiatives.flatMap(item =>
    item.primaryMetric && item.primaryMetricLabel
      ? [{ slug: item.slug, title: item.title, value: item.primaryMetric, label: item.primaryMetricLabel }]
      : [],
  );
  const isStaging = canExposeSyntheticStagingContent();
  const openAppeals = appealRecords.filter(appeal => isAppealOpenForDonations(appeal) && (isStaging || !isSyntheticStagingAppeal(appeal)));
  // The public listing is not permission to process a payment.
  // Verify the approved appeal and exact balance again for a bounded set.
  // One publication-checked read for at most twelve candidates; the final
  // payment endpoints independently recheck state and exact balances.
  const reviewedAppeals = await getReviewedDonationPageData(openAppeals.slice(0, 12).map(record => record.slug));
  // The reviewed projection already preserves priority and excludes unpayable
  // records. Keep the live amount guard and display only four destinations.
  const eligibleChoices = reviewedAppeals.flatMap(appeal => {
    const remaining = getDonationCheckoutRemainingAmount(appeal);
    if (remaining === null) return [];
    return [{
      id: appeal.id,
      slug: appeal.slug,
      title: appeal.title,
      maxAmount: remaining,
      zakatEligible: appeal.zakatEligible,
      copy: donationFormCopy(appeal.zakatEligible),
    } satisfies ReviewedAppealChoice];
  }).slice(0, 4);
  const hasOpenAppeals = eligibleChoices.length > 0;
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle={hasOpenAppeals ? "Give With Purpose" : "Support Responsibly"}
      heroVisualNote={hasOpenAppeals ? "Choose a verified public appeal, explore Taleem sponsorship, or ask Amaana about a currently approved programme giving route." : "There is no reviewed checkout option on this page right now. You can browse the public appeals, explore Taleem sponsorship, or contact Amaana about approved giving routes."}
      title={hasOpenAppeals ? "Give With Confidence. Give With Purpose." : "Find an Approved Way to Support."}
      intro={hasOpenAppeals ? "Every contribution is an amaana. Choose where your support should go: a specific verified appeal or a currently approved programme." : "Every contribution is an amaana. No reviewed on-page checkout is currently available. Browse the public appeals, or speak with Amaana about a currently approved programme before contributing."}
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
        <article className={styles.route}><span>Route 01</span><h3>{hasOpenAppeals ? "Support a verified public appeal" : "Public appeals"}</h3><p>{hasOpenAppeals ? `There ${eligibleChoices.length === 1 ? "is" : "are"} currently ${eligibleChoices.length} reviewed public ${eligibleChoices.length === 1 ? "appeal" : "appeals"} accepting support. Review the context and remaining verified target before continuing to secure domestic INR checkout.` : "No reviewed appeal checkout is currently available here. Browse the public appeals for the latest published case information; checkout is offered only for individually verified, payable appeals."}</p>{hasOpenAppeals && <Link className="v2-button" href="#choose-appeal-checkout">Choose an appeal & give here</Link>}<Link className={hasOpenAppeals ? "v2-text-link" : "v2-button"} href="/appeals">{hasOpenAppeals ? "Review all verified appeals →" : "View appeals and completed cases"}</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>Support education or another approved programme</h3><p>Taleem sponsorship and programme giving begin with the currently available programme route or a conversation with Amaana about an approved destination.</p><Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      <VerifiedImpactStrip items={impactItems} headingId="donate-published-outcomes" />
      {eligibleChoices.length > 0 &&
        <AppealLandingCheckout appeals={eligibleChoices} paymentDetails={getDonationPaymentDetails()} />}
      <p className={styles.note}>Choose the route that matches your intention: an open appeal supports that specific published need, while programme support is available only when Amaana has confirmed an approved destination.</p>
    </CanonicalArticle>
  );
}
