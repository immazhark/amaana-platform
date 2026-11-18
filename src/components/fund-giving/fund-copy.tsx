import { donationFormCopy, type DonationFormCopy } from "@/components/donation-form-copy";
import formStyles from "@/components/donation-form.module.css";
import { allowedIntentsForFund, zakatNoticeForFund, type FundZakatPolicyId, type GivingIntentId } from "@/lib/giving-funds";

export type GiveFund = { slug: string; name: string; summary: string; zakatPolicy: FundZakatPolicyId; isGeneral: boolean };

const INTENT_LABEL: Record<GivingIntentId, string> = { GENERAL: "General Charity", SADAQAH: "Sadaqah", ZAKAT: "Zakat" };
const INTENT_NOTE: Record<GivingIntentId, string> = {
  GENERAL: "A general charitable gift to this fund.",
  SADAQAH: "Recorded as voluntary Sadaqah.",
  ZAKAT: "Recorded as Zakat and kept in Amaana's separate Zakat account, to be used only for eligible recipients.",
};

export const ZAKAT_TAG: Record<FundZakatPolicyId, string> = { ACCEPTED: "Zakat accepted", NOT_ACCEPTED: "Non-Zakat only", UNDER_REVIEW: "Non-Zakat only" };

// Same shape as an appeal's copy so the existing, hardened checkout forms are reused unchanged.
export function fundDonationFormCopy(fund: GiveFund): DonationFormCopy {
  const base = donationFormCopy(false);
  const intents = allowedIntentsForFund(fund.zakatPolicy);
  const notice = zakatNoticeForFund(fund.zakatPolicy);
  const options = (checkedByDefault: boolean) => <>{intents.map((intent, index) => (
    <label className={formStyles.intentOption} key={intent}>
      <input type="radio" name="givingIntent" value={intent} defaultChecked={index === 0} required={checkedByDefault} />
      <span><strong>{INTENT_LABEL[intent]}</strong><small>{INTENT_NOTE[intent]}</small></span>
    </label>
  ))}</>;
  return {
    ...base,
    heading: <div className="v2-form-heading"><span>Give to {fund.name}</span><h2 id="donation-form-heading">Complete your gift.</h2><p id="donation-form-description">Only what is needed to process and acknowledge your gift is collected. Your gift is recorded against {fund.name}.</p></div>,
    intentIntroduction: <p className={formStyles.intentIntro}>Choose how you want this gift recorded.</p>,
    intentionOptions: options(true),
    intentionNote: <small className={formStyles.intentNote}>{notice ?? "Zakat gifts are recorded separately and used only for eligible recipients."}</small>,
    direct: { ...base.direct, intentOptions: <div className={formStyles.intentGrid}>{options(false)}</div> },
  };
}
