import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { CanonicalArticle } from "@/components/canonical-article";
import { complianceCopy } from "@/lib/master-copy";
import { getAppealsIndexData, getDonationPageData, getDonationImpactHighlights } from "@/lib/public-page-data";
import { getPublicAppealProgress } from "@/lib/public-appeal-progress";
import { getWholeRupeeCheckoutRange } from "@/lib/donation-amount-input";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { DonationPaymentInstructions } from "@/components/donation-payment-instructions";
import type { AppealDonationChoice } from "@/components/appeal-donation-flow";
import { DonationLandingCheckout } from "@/components/donation-checkout";
import { VerifiedImpactStrip, type VerifiedImpactItem } from "@/components/verified-impact-strip";
import { getPublicAppealCheckoutEligibility } from "@/lib/public-appeal-checkout";
import { canExposeSyntheticStagingContent, isSyntheticStagingAppeal } from "@/lib/public-environment";
import { getDonorFundChoices } from "@/lib/donor-funds";

import { logServerError } from "@/lib/server-log";
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

// Approval and release-control changes must be checked for each server visit.
export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ giving?: string | string[] }> };

export default async function Page({ searchParams }: PageProps = {}) {
  // Deep links change which *approved* checkout is initially visible, never
  // bypass the existing live eligibility gates in either destination form.
  const [resolvedSearch, appealRecords, fundResult, publishedInitiatives] = await Promise.all([
    searchParams,
    getAppealsIndexData(),
    getDonorFundChoices().then(funds => ({ funds, failed: false }), error => {
    logServerError("donation.fund_choices_unavailable", { errorName: error instanceof Error ? error.name : "unknown" });
    return { funds: [], failed: true };
  }), getDonationImpactHighlights().catch(error => {
    logServerError("donation.published_impact_unavailable", { errorName: error instanceof Error ? error.name : "unknown" });
    return [];
  }),
  ]);
  const initialRoute = resolvedSearch?.giving === "fund" ? "fund" : "appeal";
  const { funds, failed: fundReadFailed } = fundResult;
  const isStaging = canExposeSyntheticStagingContent();
  const openAppeals = appealRecords.filter(appeal =>
    getPublicAppealCheckoutEligibility(appeal) &&
    (isStaging || !isSyntheticStagingAppeal(appeal)),
  );
  const hasOpenAppeals = openAppeals.length > 0;
  const hasFunds = funds.length > 0;
  // Checkout choices are independently re-read through the full appeal donation
  // privacy/eligibility projection; index publication does not itself grant checkout.
  // Bound the number of extra reads and avoid shipping private review details.
  const approvedAppeals = await Promise.all(openAppeals.slice(0, 4).map(record =>
    getDonationPageData(record.slug),
  ));
  const appealChoices: AppealDonationChoice[] = approvedAppeals.flatMap(appeal => {
    if (!appeal) return [];
    const progress = getPublicAppealProgress(appeal.amountRaised, appeal.goalAmount);
    if (!progress || !getWholeRupeeCheckoutRange(progress.remaining)) return [];
    return [{
      id: appeal.id, slug: appeal.slug, title: appeal.title,
      raised: progress.raised, goal: progress.goal, remaining: progress.remaining,
      zakatEligible: appeal.zakatEligible,
    }];
  });
  const impactItems: VerifiedImpactItem[] = publishedInitiatives.map(item => ({
      slug: item.slug, title: item.title,
      value: item.primaryMetric!, label: item.primaryMetricLabel!,
    }));
  const hasCheckout = appealChoices.length > 0 || hasFunds;
  const paymentDetails = appealChoices.length ? getDonationPaymentDetails() : null;
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle={hasCheckout ? "Give With Purpose" : "Support Responsibly"}
      heroVisualNote={hasFunds ? "Choose an independently reviewed giving fund below, or review the available public appeals and programme routes." : hasOpenAppeals ? "Choose a verified public appeal, explore Taleem sponsorship, or ask Amaana about a currently approved programme giving route." : "There is no active public appeal right now. Explore Taleem sponsorship or ask Amaana about a currently approved programme giving route."}
      title={hasCheckout ? "Give With Confidence. Give With Purpose." : "Find an Approved Way to Support."}
      intro={hasFunds ? "Every contribution is an amaana. Review an approved fund’s purpose and restrictions, choose your intention, and confirm that purpose before secure domestic INR checkout." : hasOpenAppeals ? "Every contribution is an amaana. Choose where your support should go: a specific verified appeal or a currently approved programme." : "Every contribution is an amaana. No public appeal is accepting donations right now, so choose an approved programme route or speak with Amaana before contributing."}
      blocks={[
        {
          title: "Choose where your support should go.",
          presentation: "default",
          paragraphs: [
            hasFunds ? "Choose an approved giving fund below after reviewing its purpose and restrictions, or support an active verified appeal. Taleem sponsorship enquiries and other programme conversations remain available." : "Support an active verified need, enquire about an ongoing programme such as Taleem or seasonal relief, or explore the work behind completed cases. Programme contributions and general giving are arranged only when Amaana confirms an available approved destination.",
          ],
        },
        {
          title: "Domestic donations only",
          paragraphs: [complianceCopy.domestic, complianceCopy.tax],
        },
      ]}
    >
      <div className={styles.routes} role="group" aria-label="Donation routes">
        <article className={styles.route}><span>Route 01</span><h3>{hasOpenAppeals ? "Support a verified public appeal" : "Public appeals"}</h3><p>{hasOpenAppeals ? `There ${openAppeals.length === 1 ? "is" : "are"} currently ${openAppeals.length} reviewed public ${openAppeals.length === 1 ? "appeal" : "appeals"} accepting support. Review the context and remaining verified target before continuing to secure domestic INR checkout.` : "No public appeal is accepting donations right now. Completed cases remain visible for accountability, and new urgent appeals appear only after review."}</p>{appealChoices.length > 0 && <Link className="v2-button" href="/donate?giving=appeal#donation-route-choice">Choose an appeal & give here</Link>}
          <Link className="v2-text-link" href="/appeals">{hasOpenAppeals ? "See all verified appeals →" : "View appeals and completed cases →"}</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>{hasFunds ? "Support an approved giving fund" : "Support education or another approved programme"}</h3><p>{hasFunds ? "Review each fund’s approved purpose and restrictions below. Contributions remain designated to the purpose you confirm." : "Taleem sponsorship and programme giving begin with the currently available programme route or a conversation with Amaana about an approved destination."}</p>{hasFunds && <Link className="v2-button" href="/donate?giving=fund#donation-route-choice">Review approved giving funds</Link>}<Link className="v2-button v2-button--paper-secondary" href="/get-involved/sponsor-education">Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      {process.env.AMAANA_ZAKAT_ESTIMATOR_REVIEWED === "true" && <div className={styles.note}>
        Planning a Zakat contribution?{" "}
        <Link href="/zakat-calculator">Use the educational estimate</Link> before reviewing the currently approved giving purposes.
        An estimate does not establish which fund is authorised to accept Zakat.
      </div>}
      <p className={styles.note}>
        Looking for source-reviewed reflections on charitable giving?{" "}
        <Link href="/giving/learn">Explore the Islamic giving learning library</Link>.
        Educational content never determines whether an approved fund can accept your specific intention.
      </p>
      <p className={styles.note}>
        Prefer to review giving opportunities each month?{" "}
        <Link href="/get-involved/monthly-giving">Prepare a private calendar reminder</Link>.
        This is not a subscription or automatic payment; verify the approved destination every time.
      </p>
      <VerifiedImpactStrip items={impactItems} headingId="donate-published-outcomes" />
      {hasCheckout && <DonationLandingCheckout key={initialRoute} initialRoute={initialRoute} appeals={appealChoices} funds={funds}
        bankAvailable={Boolean(paymentDetails?.bank)}
        paymentInstructions={paymentDetails ? {
          DIRECT_UPI: <DonationPaymentInstructions method="DIRECT_UPI" paymentDetails={paymentDetails} />,
          BANK_TRANSFER: <DonationPaymentInstructions method="BANK_TRANSFER" paymentDetails={paymentDetails} />,
        } : { DIRECT_UPI: null, BANK_TRANSFER: null }}/>}
      {appealChoices.length === 0 && hasOpenAppeals && <p role="status" className={styles.note}>
        An appeal may have changed, or its exact remaining balance may no longer permit a whole-rupee checkout. Review the current case and contact Amaana before transferring any unsupported amount.
      </p>}
      {fundReadFailed && <p role="status" className={styles.note}>Giving fund availability could not be checked. Please refresh later or contact Amaana before contributing to a programme.</p>}
      <p className={styles.note}>Choose the route that matches your intention: an open appeal supports that specific published need, while programme support is available only when Amaana has confirmed an approved destination.</p>
    </CanonicalArticle>
  );
}
