import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonationOptions } from "@/components/donation-options";
import { PageHero } from "@/components/page-hero";
import { getPublicAppealCheckoutEligibility } from "@/lib/public-appeal-checkout";
import { getDonationPageData } from "@/lib/public-page-data";
import { getAppealSearchPrivacy } from "@/lib/appeal-search-privacy";
import { getAppealPublicCopy } from "@/lib/appeal-public-copy";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [appeal, confidentiality] = await Promise.all([
    getDonationPageData(slug), getAppealSearchPrivacy(slug),
  ]);
  if (!appeal) return { title: "Donation unavailable", robots: { index: false, follow: false } };
  const canonical = `/donate/${appeal.slug}`;
  const sensitive = confidentiality === "HIGHLY_SENSITIVE";
  const publicCopy = getAppealPublicCopy(appeal.title, appeal.summary, sensitive);
  // Donation pages are intentionally excluded from indexing, but previews
  // and direct link shares must still obey the stricter confidential metadata boundary.
  const title = sensitive ? "Support a Verified Appeal" : `Support ${publicCopy.title}`;
  const description = sensitive
    ? publicCopy.description
    : `Support ${publicCopy.title} through Amaana Foundation's secure domestic INR donation journey.`;
  return {
    title, description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: canonical, title: `${title} | Amaana Foundation`, description },
    twitter: { card: "summary", title: `${title} | Amaana Foundation`, description },
  };
}

export default async function DonatePage({ params }: Props) {
  const { slug } = await params;
  const appeal = await getDonationPageData(slug);
  if (!appeal) notFound();
  const checkout = getPublicAppealCheckoutEligibility(appeal);
  if (!checkout) notFound();
  const { remainingLabel } = checkout.progress;
  const paymentDetails = getDonationPaymentDetails();

  return <div className="v2-home v2-donate-page">
    <PageHero
      variant="level2"
      eyebrow="A considered act of support"
      title="Give with clarity."
      description={<p>You have chosen to support <strong>{appeal.title}</strong>. Review the appeal first if you need more context; when you are ready, choose secure online checkout, direct UPI or direct bank transfer.</p>}
      actions={[{label:"Return to the appeal",href:`/appeals/${appeal.slug}`,secondary:true},{label:"Continue to donation form",href:"#donation-form"}]}
      visual={(
        <div className="page-hero__visual-fallback page-hero__visual-fallback--stats">
          <span>Supporting</span><strong>{appeal.title}</strong><div className="page-hero__stat-row"><b>{remainingLabel}</b><small>remaining verified need · domestic INR only</small></div><i />
        </div>
      )}
    />

    <section className="v2-section paper v2-donate-form-section" id="donation-form" aria-labelledby="donation-form-heading"><div className="v2-shell v2-donate-layout"><aside className="v2-donate-guide"><p className="v2-section-label">Before you continue</p><h2>Your donation should feel understood, not rushed.</h2><div className="v2-donate-guide-list"><article><span>01</span><div><h3>Choose your amount</h3><p>Give an amount that is comfortable for you, up to the appeal&apos;s remaining need of {remainingLabel}.</p></div></article><article><span>02</span><div><h3>Confirm the source</h3><p>Amaana currently accepts domestic Indian contributions only and is not FCRA-registered.</p></div></article><article><span>03</span><div><h3>Choose your payment route</h3><p>Use Razorpay secure checkout, Amaana&apos;s verified UPI details, or the Foundation&apos;s official bank account.</p></div></article><article><span>04</span><div><h3>Keep your reference</h3><p>Online payments are verified through Razorpay. Direct UPI and bank transfers remain pending until Amaana reconciles the UTR/reference against received funds.</p></div></article></div></aside><div><DonationOptions appealId={appeal.id} appealTitle={appeal.title} maxAmount={checkout.range.maximum} zakatEligible={appeal.zakatEligible} paymentDetails={paymentDetails}/></div></div></section>

    <section className="v2-donate-assurance" aria-label="Donation assurances"><div className="v2-shell"><div><small>Privacy</small><strong>Your details are collected for donation processing and acknowledgement.</strong></div><div><small>Payment choice</small><strong>Use Razorpay, direct UPI or verified bank transfer. Direct transfers count only after reconciliation.</strong></div><div><small>Tax document</small><strong>The acknowledgement is not presented as an 80G tax-deduction certificate.</strong></div></div></section>
  </div>;
}
