import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CanonicalArticle } from "@/components/canonical-article";
import { FundGivingCheckout } from "@/components/fund-giving/fund-giving-checkout";
import type { GiveFund } from "@/components/fund-giving/fund-copy";
import { PublicRouteLoading } from "@/components/public-route-loading";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
import { complianceCopy } from "@/lib/master-copy";
import { prisma } from "@/lib/prisma";
import { feeEstimateBasisPoints } from "@/lib/processing-fee";

const description = "Choose the fund your gift supports and give securely. Every gift is recorded against the fund you choose.";

export const metadata: Metadata = {
  title: "Give to a Fund",
  description,
  alternates: { canonical: "/give" },
  openGraph: { type: "website", url: "/give", title: "Give | Amaana Foundation", description },
};

// Fund availability and the activation switch are rechecked on every request.
export const dynamic = "force-dynamic";

async function GiveContent({ fundParam }: { fundParam: Promise<{ fund?: string | string[] }> }) {
  if (!isFundGivingEnabled()) notFound();
  const [{ fund: requested }, rows] = await Promise.all([
    fundParam,
    prisma.fund.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, summary: true, zakatPolicy: true, isGeneral: true },
    }),
  ]);
  if (rows.length === 0) notFound();
  const funds: GiveFund[] = rows;
  const initialSlug = typeof requested === "string" ? requested : undefined;
  return (
    <CanonicalArticle
      eyebrow="Give · Amaana Foundation"
      heroVariant="action"
      heroVisualTitle="Give With Intention"
      heroVisualNote="Choose a fund, set your amount and give securely. Your gift is recorded against the cause you chose."
      title="Choose Where Your Gift Goes."
      intro="Every contribution is an amaana, a trust. Pick the fund that matches your intention; the fund you choose is the fund your gift is recorded against."
      blocks={[
        { title: "Domestic donations only", paragraphs: [complianceCopy.domestic, complianceCopy.tax] },
      ]}
    >
      <FundGivingCheckout funds={funds} initialSlug={initialSlug} paymentDetails={getDonationPaymentDetails()} feeBps={feeEstimateBasisPoints()} />
    </CanonicalArticle>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ fund?: string | string[] }> }) {
  return (
    <Suspense fallback={<PublicRouteLoading route="donate" />}>
      <GiveContent fundParam={searchParams} />
    </Suspense>
  );
}
