import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicRouteLoading } from "@/components/public-route-loading";
import { getReviewedDonationPageData, getDonationImpactHighlights } from "@/lib/public-page-data";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import type { ReviewedAppealChoice } from "@/components/donation-methods";
import { donationFormCopy } from "@/components/donation-form-copy";
import { VerifiedImpactStrip, type VerifiedImpactItem } from "@/components/verified-impact-strip";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
import { logServerError } from "@/lib/server-log";
import { DonatePageView } from "./donate-page-view";

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

// Optional published evidence must not block the giving interface.
async function DonateImpactEvidence() {
  const publishedInitiatives = await getDonationImpactHighlights().catch(error => {
    logServerError("donation.published_impact_unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return [];
  });
  const impactItems: VerifiedImpactItem[] = publishedInitiatives.flatMap(item =>
    item.primaryMetric && item.primaryMetricLabel
      ? [{ slug: item.slug, title: item.title, value: item.primaryMetric, label: item.primaryMetricLabel }]
      : [],
  );
  return impactItems.length ? <VerifiedImpactStrip items={impactItems} headingId="donate-published-outcomes" /> : null;
}

async function DonatePageContent() {
  const reviewedAppeals = await getReviewedDonationPageData().then(
    choices => ({ choices, unavailable: false as const }),
    () => {
      logServerError("donation.reviewed_appeals_unavailable");
      return { choices: [], unavailable: true as const };
    },
  );
  // These server-approved records still need a final checkout balance check.
  // The reviewed projection already preserves priority and excludes unpayable
  // records. Keep the live amount guard and display only four destinations.
  const eligibleChoices = reviewedAppeals.choices.flatMap(appeal => {
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
  return (
    <DonatePageView
      choices={eligibleChoices}
      appealsUnavailable={reviewedAppeals.unavailable}
      impactEvidence={<Suspense fallback={null}><DonateImpactEvidence /></Suspense>}
      paymentDetails={getDonationPaymentDetails()}
      fundGivingEnabled={isFundGivingEnabled()}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PublicRouteLoading route="donate" />}>
      <DonatePageContent />
    </Suspense>
  );
}
