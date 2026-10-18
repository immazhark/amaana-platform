import type { ReactNode } from "react";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";
import styles from "./donation-form.module.css";

/** Static, reviewed donor guidance is rendered on the server and passed as
 * React slots into the client checkout. Native inputs remain interactive. */
export type DonationFormCopy = {
  heading: ReactNode;
  intentIntroduction: ReactNode;
  intentionOptions: ReactNode;
  intentionNote: ReactNode;
  anonymityText: ReactNode;
  domesticText: ReactNode;
  readyHelp: ReactNode;
};

export function donationFormCopy(zakatEligible: boolean): DonationFormCopy {
  const intentions: DonationIntentValue[] = ["GENERAL", "SADAQAH", ...(zakatEligible ? ["ZAKAT" as const] : [])];
  return {
    heading: <div className="v2-form-heading"><span>Secure contribution</span><h2 id="donation-form-heading">Choose how you would like to support.</h2><p id="donation-form-description">Only the information needed to process and acknowledge your contribution is requested.</p></div>,
    intentIntroduction: <p className={styles.intentIntro}>Choose how you want this contribution recorded. The selected appeal remains the designated destination in every case.</p>,
    intentionOptions: <>{intentions.map((intent, index) => (
      <label className={styles.intentOption} key={intent}>
        <input type="radio" name="givingIntent" value={intent} defaultChecked={index === 0} required />
        <span><strong>{DONATION_INTENT_LABELS[intent]}</strong><small>{DONATION_INTENT_DESCRIPTIONS[intent]}</small></span>
      </label>
    ))}</>,
    intentionNote: <small className={styles.intentNote}>{zakatEligible ? "Amaana has explicitly reviewed this appeal as Zakat-eligible. Your selection records your giving intention; it does not alter the underlying verification record." : "Zakat is shown only on appeals that Amaana has explicitly reviewed as Zakat-eligible."}</small>,
    anonymityText: <span><strong>Keep my public identity private</strong><small>Do not show my name in any public donor listing.</small></span>,
    domesticText: <span><strong>Domestic contribution confirmation</strong><small>I confirm this donation is from an Indian source using a domestic payment method.</small></span>,
    readyHelp: <small>Next: Razorpay secure checkout. Your Amaana acknowledgement follows successful payment verification and is not an 80G tax-deduction certificate.</small>,
  };
}
