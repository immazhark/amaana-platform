import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation-form";
import { PageHero } from "@/components/page-hero";
import { formatINR, getRemainingAppealAmount } from "@/lib/appeals";
import { getDonationPageData } from "@/lib/public-page-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const appeal = await getDonationPageData(slug);
  if (!appeal) return { title: "Donation unavailable" };
  const canonical = `/donate/${appeal.slug}`;
  const description = `Support ${appeal.title} through Amaana Foundation's secure domestic INR donation journey.`;
  return { title: `Support ${appeal.title}`, description, alternates: { canonical }, robots: { index: false, follow: true }, openGraph: { type: "website", url: canonical, title: `Support ${appeal.title} | Amaana Foundation`, description }, twitter: { card: "summary", title: `Support ${appeal.title} | Amaana Foundation`, description } };
}

export default async function DonatePage({ params }: Props) {
  const { slug } = await params;
  const appeal = await getDonationPageData(slug);
  if (!appeal) notFound();
  const remainingAmount = getRemainingAppealAmount(appeal.amountRaised, appeal.goalAmount);

  return <div className="v2-home v2-donate-page">
    <PageHero
      variant="level2"
      eyebrow="A considered act of support"
      title="Give with clarity."
      description={<p>You have chosen to support <strong>{appeal.title}</strong>. Review the appeal first if you need more context; when you are ready, the secure payment step opens through Razorpay.</p>}
      actions={[{label:"Return to the appeal",href:`/appeals/${appeal.slug}`,secondary:true},{label:"Continue to donation form",href:"#donation-form"}]}
      visual={(
        <div className="page-hero__visual-fallback page-hero__visual-fallback--stats">
          <span>Supporting</span><strong>{appeal.title}</strong><div className="page-hero__stat-row"><b>{formatINR(remainingAmount)}</b><small>remaining verified need · domestic INR only</small></div><i />
        </div>
      )}
    />

    <section className="v2-section paper v2-donate-form-section" id="donation-form" aria-labelledby="donation-form-heading"><div className="v2-shell v2-donate-layout"><aside className="v2-donate-guide"><p className="v2-section-label">Before you continue</p><h2>Your donation should feel understood, not rushed.</h2><div className="v2-donate-guide-list"><article><span>01</span><div><h3>Choose your amount</h3><p>Give an amount that is comfortable for you, up to the appeal&apos;s remaining need of {formatINR(remainingAmount)}.</p></div></article><article><span>02</span><div><h3>Confirm the source</h3><p>Amaana currently accepts domestic Indian contributions only and is not FCRA-registered.</p></div></article><article><span>03</span><div><h3>Secure handoff</h3><p>Payment is completed in Razorpay&apos;s secure checkout after this form.</p></div></article><article><span>04</span><div><h3>Keep your reference</h3><p>After verification, you are taken to a donation acknowledgement with a reference number.</p></div></article></div></aside><div><DonationForm appealId={appeal.id} appealTitle={appeal.title} maxAmount={remainingAmount} zakatEligible={appeal.zakatEligible}/></div></div></section>

    <section className="v2-donate-assurance" aria-label="Donation assurances"><div className="v2-shell"><div><small>Privacy</small><strong>Your details are collected for donation processing and acknowledgement.</strong></div><div><small>Payment</small><strong>Secure checkout is handled by Razorpay.</strong></div><div><small>Tax document</small><strong>The acknowledgement is not presented as an 80G tax-deduction certificate.</strong></div></div></section>
  </div>;
}
