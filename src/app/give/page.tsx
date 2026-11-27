import type { Metadata } from "next";
import { fundDonationFormCopy } from "@/components/fund-giving/fund-copy";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CanonicalArticle } from "@/components/canonical-article";
import { FundGivingCheckout } from "@/components/fund-giving/fund-giving-checkout";
import { fundGlyphs } from "@/components/fund-giving/fund-glyphs";
import type { GiveCampaign, GiveFund } from "@/components/fund-giving/fund-copy";
import { PublicRouteLoading } from "@/components/public-route-loading";
import { VerifiedImpactStrip } from "@/components/verified-impact-strip";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
import { GIVE_HERO_ACTIONS } from "@/lib/giving-hero-actions";
import { complianceCopy } from "@/lib/master-copy";
import { prisma } from "@/lib/prisma";
import { feeEstimateBasisPoints } from "@/lib/processing-fee";
import { getDonationImpactHighlights } from "@/lib/public-page-data";
import { logServerError } from "@/lib/server-log";

const description = "Choose the fund your gift supports and give securely. Every gift is recorded against the fund you choose.";

export const metadata: Metadata = {
  title: "Give to a Fund",
  description,
  alternates: { canonical: "/give" },
  openGraph: { type: "website", url: "/give", title: "Give | Amaana Foundation", description },
};

// Fund availability and the activation switch are rechecked on every request.
export const dynamic = "force-dynamic";

// Optional evidence streams independently of the checkout and never gates giving.
async function GiveImpactEvidence() {
  const initiatives = await getDonationImpactHighlights().catch(error => {
    logServerError("give.published_impact_unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return [];
  });
  const items = initiatives.flatMap(item =>
    item.primaryMetric && item.primaryMetricLabel
      ? [{ slug: item.slug, title: item.title, value: item.primaryMetric, label: item.primaryMetricLabel }]
      : [],
  );
  return items.length ? <VerifiedImpactStrip items={items} headingId="give-published-outcomes" /> : null;
}

async function GiveContent({ fundParam }: { fundParam: Promise<{ fund?: string | string[] }> }) {
  const [{ fund: requested }, rows] = await Promise.all([
    fundParam,
    prisma.fund.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, summary: true, zakatPolicy: true, isGeneral: true },
    }),
  ]);
  if (rows.length === 0) notFound();
  // Only campaigns that are ACTIVE and inside their window right now; the server re-checks at order time.
  const now = new Date();
  const campaignRows = await prisma.fundCampaign.findMany({
    where: { status: "ACTIVE", opensAt: { lte: now }, closesAt: { gt: now }, fund: { status: "ACTIVE" } },
    orderBy: { opensAt: "asc" },
    select: { slug: true, title: true, unitLabel: true, unitLabelPlural: true, unitPrice: true, maxUnits: true, note: true, closesAt: true, fund: { select: { slug: true } } },
  });
  const campaigns: GiveCampaign[] = campaignRows.map(row => ({
    slug: row.slug, fundSlug: row.fund.slug, title: row.title, unitLabel: row.unitLabel, unitLabelPlural: row.unitLabelPlural,
    unitPrice: row.unitPrice.toNumber(), maxUnits: row.maxUnits, note: row.note,
    closesLabel: row.closesAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }),
  }));
  const funds: GiveFund[] = rows;
  const initialSlug = typeof requested === "string" ? requested : undefined;
  return (
    <CanonicalArticle
      eyebrow="Give · Amaana Foundation"
      heroVariant="action"
      heroActions={[...GIVE_HERO_ACTIONS]}
      heroVisualTitle="Give With Intention"
      heroVisualNote="Choose a fund, set your amount and give securely. Your gift is recorded against the cause you chose."
      title="Choose Where Your Gift Goes."
      intro="Every contribution is an amaana, a trust. Pick the fund that matches your intention; the fund you choose is the fund your gift is recorded against."
      blocks={[
        { title: "Domestic donations only", paragraphs: [complianceCopy.domestic, complianceCopy.tax] },
      ]}
    >
      <FundGivingCheckout funds={funds} glyphs={fundGlyphs(funds)} copies={Object.fromEntries(funds.map(fund => [fund.slug, fundDonationFormCopy(fund)]))} campaigns={campaigns} initialSlug={initialSlug} paymentDetails={getDonationPaymentDetails()} feeBps={feeEstimateBasisPoints()} />
      <Suspense fallback={null}><GiveImpactEvidence /></Suspense>
    </CanonicalArticle>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ fund?: string | string[] }> }) {
  // Checked before streaming starts so a closed page is a real HTTP 404, not a 200 that renders a not-found body.
  if (!isFundGivingEnabled()) notFound();
  return (
    <Suspense fallback={<PublicRouteLoading route="give" />}>
      <GiveContent fundParam={searchParams} />
    </Suspense>
  );
}
