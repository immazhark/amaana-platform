import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { AppealLandingCheckout, type ReviewedAppealChoice } from "@/components/donation-methods";
import { VerifiedImpactStrip, type VerifiedImpactItem } from "@/components/verified-impact-strip";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { complianceCopy } from "@/lib/master-copy";
import styles from "./donate-audit.module.css";

export const CHECKOUT_ANCHOR = "#choose-appeal-checkout";
const TALEEM_ROUTE = "/get-involved/sponsor-education";

type HeroAction = { label: string; href: string; secondary?: boolean };

/**
 * The donation page's first action must lead towards giving. The generic
 * article default ("Explore Our Work" / "Contact Amaana") put two non-giving
 * actions above the fold on the one page whose job is to accept a gift.
 */
export function donateHeroActions(hasOpenAppeals: boolean, fundGivingEnabled: boolean): HeroAction[] {
  if (fundGivingEnabled) {
    return [
      { label: "Choose a fund", href: "/give" },
      hasOpenAppeals
        ? { label: "Give to a verified appeal", href: CHECKOUT_ANCHOR, secondary: true }
        : { label: "View verified appeals", href: "/appeals", secondary: true },
    ];
  }
  return hasOpenAppeals
    ? [
        { label: "Give to a verified appeal", href: CHECKOUT_ANCHOR },
        { label: "Explore Taleem sponsorship", href: TALEEM_ROUTE, secondary: true },
      ]
    : [
        { label: "View verified appeals", href: "/appeals" },
        { label: "Explore Taleem sponsorship", href: TALEEM_ROUTE, secondary: true },
      ];
}

/** Factual, non-duplicating summary for the hero panel (no totals, no claims). */
export function donateHeroPanel(openAppealCount: number): { title: string; note: string } {
  if (openAppealCount > 0) {
    return {
      title: "Open for support today",
      note: `${openAppealCount} reviewed ${openAppealCount === 1 ? "appeal is" : "appeals are"} accepting gifts. Domestic INR only, with secure checkout on this page.`,
    };
  }
  return {
    title: "Support Responsibly",
    note: "Browse the public appeals, or ask Amaana about an approved programme route.",
  };
}

export type DonatePageViewProps = {
  choices: readonly ReviewedAppealChoice[];
  impactItems: readonly VerifiedImpactItem[];
  paymentDetails: DonationPaymentDetails;
  fundGivingEnabled: boolean;
};

/** Pure presentation of the donate page. Data loading stays in `page.tsx`. */
export function DonatePageView({ choices, impactItems, paymentDetails, fundGivingEnabled }: DonatePageViewProps) {
  const hasOpenAppeals = choices.length > 0;
  const panel = donateHeroPanel(choices.length);
  return (
    <CanonicalArticle
      eyebrow="Donate · Amaana Foundation"
      heroVariant="action"
      heroActions={donateHeroActions(hasOpenAppeals, fundGivingEnabled)}
      heroVisualTitle={panel.title}
      heroVisualNote={panel.note}
      title={hasOpenAppeals ? "Give With Confidence. Give With Purpose." : "Find an Approved Way to Support."}
      intro={hasOpenAppeals
        ? "Every contribution is an amaana. Choose a specific verified appeal, or support a currently approved programme."
        : "Every contribution is an amaana. No reviewed on-page checkout is currently available. Browse the public appeals, or speak with Amaana about a currently approved programme before contributing."}
      blocks={[
        {
          title: "Domestic donations only",
          paragraphs: [complianceCopy.domestic, complianceCopy.tax],
        },
      ]}
    >
      <div className={styles.routes} role="group" aria-label="Donation routes">
        {fundGivingEnabled && <article className={`${styles.route} ${styles.routeWide}`}><span>General giving</span><h3>Give to a fund of your choice</h3><p>Choose where your gift goes — General, Taleem, Orphan, Medical and more — with Zakat, Sadaqah or General Charity recorded exactly as you intend.</p><Link className="v2-button" href="/give">Choose a fund</Link><Link className="v2-text-link" href="/funds">See how each fund is used →</Link></article>}
        <article className={styles.route}><span>Route 01</span><h3>{hasOpenAppeals ? "Support a verified public appeal" : "Public appeals"}</h3><p>{hasOpenAppeals ? `There ${choices.length === 1 ? "is" : "are"} currently ${choices.length} reviewed public ${choices.length === 1 ? "appeal" : "appeals"} accepting support. Review the context and remaining verified target before continuing to secure domestic INR checkout.` : "No reviewed appeal checkout is currently available here. Browse the public appeals for the latest published case information; checkout is offered only for individually verified, payable appeals."}</p>{hasOpenAppeals && <Link className="v2-button" href={CHECKOUT_ANCHOR}>Choose an appeal & give here</Link>}<Link className={hasOpenAppeals ? "v2-text-link" : "v2-button"} href="/appeals">{hasOpenAppeals ? "Review all verified appeals →" : "View appeals and completed cases"}</Link></article>
        <article className={styles.route}><span>Route 02</span><h3>Support education or another approved programme</h3><p>Taleem sponsorship and programme giving are arranged only when Amaana confirms an approved destination. Start with the current programme route, or speak with Amaana first.</p><Link className="v2-button v2-button--paper-secondary" href={TALEEM_ROUTE}>Explore Taleem sponsorship</Link><Link className="v2-text-link" href="/contact">Ask about programme giving →</Link></article>
      </div>
      {hasOpenAppeals && <AppealLandingCheckout appeals={choices} paymentDetails={paymentDetails} />}
      <VerifiedImpactStrip items={[...impactItems]} headingId="donate-published-outcomes" />
    </CanonicalArticle>
  );
}
