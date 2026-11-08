import Link from "next/link";
import { publicAppealShareCopy } from "@/lib/public-appeal-share";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { AppealShare } from "@/components/appeal-share";
import { DonationMethods } from "@/components/donation-methods";
import { donationFormCopy } from "@/components/donation-form-copy";
import { amountToNumber, formatINR } from "@/lib/appeals";
import { formatCheckoutRemainingINR, getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import type { getAppealCoverMedia, getAppealPageData, getDonationPageData } from "@/lib/public-page-data";
import styles from "./reviewed-medical-appeal.module.css";

type Props = {
  appeal: NonNullable<Awaited<ReturnType<typeof getAppealPageData>>>;
  donation: Awaited<ReturnType<typeof getDonationPageData>>;
  coverMedia: Awaited<ReturnType<typeof getAppealCoverMedia>>;
  paymentDetails: DonationPaymentDetails;
  highlySensitive: boolean;
};

/** Inputs must come from the existing reviewed public projections. The order
 * and transfer endpoints still independently recheck eligibility and balance. */
export function ReviewedMedicalAppeal({ appeal, donation, coverMedia, paymentDetails, highlySensitive }: Props) {
  const remaining = appeal.status === "PUBLISHED" && donation?.slug === appeal.slug
    ? getDonationCheckoutRemainingAmount(donation) : null;
  const payable = remaining !== null && donation !== null;
  const shareCopy = publicAppealShareCopy(appeal.title, appeal.summary, highlySensitive);
  const raised = amountToNumber(appeal.amountRaised);
  const goal = amountToNumber(appeal.goalAmount);
  const progress = goal > 0 ? Math.max(0, Math.min(100, Math.round(raised / goal * 100))) : 0;
  return <div className="v2-home v2-appeal-detail-page">
    <PageHero variant="level2" className="page-hero--long-title"
      eyebrow={`Medical assistance · ${appeal.beneficiaryLocation || "Location withheld"}`}
      title={appeal.title} description={<p>{appeal.summary}</p>}
      actions={[
        ...(payable ? [{ label: "Support this appeal", href: "#support-this-appeal" }] : []),
        { label: "Read the full appeal", href: "#medical-appeal-story", secondary: true },
      ]}
      visual={coverMedia ? <PublicMedia asset={coverMedia} priority /> : <WorkVisualPlaceholder label="Support with dignity" />}
    />
    <section className="v2-section paper" aria-label="Appeal details and support">
      <div className={`v2-shell ${styles.layout}`}>
        <div className={styles.story}>
          <section id="medical-appeal-story" aria-labelledby="medical-appeal-heading">
            <p className="v2-section-label">About this appeal</p>
            <h2 id="medical-appeal-heading">{appeal.beneficiaryDisplayName || "A request for medical support"}</h2>
            <div className={styles.storyText}>{appeal.story}</div>
            <p className={styles.note}>Only information cleared for public sharing appears here. Supporting medical documents remain private.</p>
          </section>
          {appeal.updates.length > 0 && <section aria-labelledby="medical-updates-heading">
            <h2 id="medical-updates-heading">Appeal updates</h2>
            {appeal.updates.map(update => <article className={styles.update} key={update.id}>
              {update.publishedAt && <time dateTime={update.publishedAt.toISOString()}>{update.publishedAt.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })}</time>}
              <h3>{update.title}</h3><p>{update.content}</p>
            </article>)}
          </section>}
          <AppealShare title={shareCopy.title} summary={shareCopy.summary} path={`/appeals/${appeal.slug}`} />
        </div>
        <section className={styles.support} id="support-this-appeal" aria-labelledby="medical-support-heading">
          <p className="v2-section-label">{payable ? "Support this appeal" : "Funding status"}</p>
          <h2 id="medical-support-heading">{formatINR(raised)} raised</h2>
          <p>of {formatINR(goal)} approved target</p>
          <div className={styles.progress} role="progressbar" aria-label="Appeal funding progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${formatINR(raised)} raised of ${formatINR(goal)}`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          {payable && donation ? <>
            <p><strong>{formatCheckoutRemainingINR(remaining)} remaining</strong></p>
            <p>Choose Razorpay secure checkout, direct UPI or bank transfer below. Amaana accepts domestic Indian contributions in INR only.</p>
            <DonationMethods appealId={donation.id} appealTitle={donation.title} maxAmount={remaining}
              zakatEligible={donation.zakatEligible} paymentDetails={paymentDetails} copy={donationFormCopy(donation.zakatEligible)} />
            <p className={styles.note}>Direct UPI and bank transfers are counted only after the UTR/reference is reconciled with received funds. An ordinary acknowledgement is not an 80G tax-deduction certificate.</p>
          </> : <p>Donations are unavailable for this appeal right now. You can still read its published information and updates.</p>}
          <Link className="v2-text-link" href="/contact">Contact Amaana about this appeal →</Link>
        </section>
      </div>
    </section>
  </div>;
}
