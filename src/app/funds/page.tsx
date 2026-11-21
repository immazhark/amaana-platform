import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CanonicalArticle } from "@/components/canonical-article";
import { PublicFundLedgerView } from "@/components/fund-ledger/public-fund-ledger-view";
import { PublicRouteLoading } from "@/components/public-route-loading";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
import { FUNDS_HERO_ACTIONS } from "@/lib/giving-hero-actions";
import { getPublicFundLedger, resolveFinancialYear, selectableFinancialYears } from "@/lib/public-fund-ledger";

const description = "Where each fund stands: verified gifts received, spending published, and money held for purpose, by financial year.";

export const metadata: Metadata = {
  title: "Our Funds",
  description,
  alternates: { canonical: "/funds" },
  openGraph: { type: "website", url: "/funds", title: "Our Funds | Amaana Foundation", description },
};

// Figures and the activation switch are rechecked on every request.
export const dynamic = "force-dynamic";

async function FundsContent({ params }: { params: Promise<{ fy?: string | string[] }> }) {
  const now = new Date();
  const { fy } = await params;
  const range = resolveFinancialYear(fy, now);
  const { rows, totals } = await getPublicFundLedger(range);
  if (rows.length === 0) notFound();
  return (
    <CanonicalArticle
      eyebrow="Our funds · Amaana Foundation"
      heroVariant="action"
      heroActions={[...FUNDS_HERO_ACTIONS]}
      heroVisualTitle="Where Your Gift Went"
      heroVisualNote="Each fund shows what was received, what was spent and published, and what is held for its purpose."
      title="Every Fund, Accounted For."
      intro="All gifts reach one bank account. Here they are separated by the fund each donor chose, with the spending we have published against it."
      blocks={[]}
    >
      <PublicFundLedgerView rows={rows} totals={totals} year={range.label} years={selectableFinancialYears(now)} />
    </CanonicalArticle>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ fy?: string | string[] }> }) {
  // Checked before streaming starts so a closed page is a real HTTP 404.
  if (!isFundGivingEnabled()) notFound();
  return (
    <Suspense fallback={<PublicRouteLoading route="donate" />}>
      <FundsContent params={searchParams} />
    </Suspense>
  );
}
