"use client";

import { GivingNoScriptNotice } from "@/components/giving-no-script-notice";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { getWholeRupeeCheckoutRange } from "@/lib/donation-amount-input";
import { formatCheckoutRemainingINR } from "@/lib/donation-checkout-balance";
import { DonationForm } from "@/components/donation-form";
import type { DonationFormCopy } from "@/components/donation-form-copy";
import { DirectTransferForm } from "@/components/direct-transfer-form";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import type { CampaignSelection } from "@/lib/fund-campaign";
import type { SponsorshipSelection } from "@/lib/taleem-sponsorship";

type Method = "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
export function DonationMethods(props: { appealId?: string; fundSlug?: string; feeBps?: number; extraFields?: ReactNode; campaign?: CampaignSelection; sponsorship?: SponsorshipSelection; appealTitle: string; maxAmount: number; zakatEligible?: boolean; paymentDetails: DonationPaymentDetails; copy: DonationFormCopy; onLockChange?: (locked: boolean) => void }) {
  const styles = props.copy.methodClasses;
  const [method,setMethod]=useState<Method>("RAZORPAY");
  const [transferLocked,setTransferLocked]=useState(false);
  const [onlineLocked,setOnlineLocked]=useState(false);
  const methodLockRef = useRef(false);
  const methodLocked = transferLocked || onlineLocked;
  const onTransferLockChange = (next: boolean) => {
    methodLockRef.current = next;
    setTransferLocked(next);
    props.onLockChange?.(next);
  };
  const onOnlineLockChange = (next: boolean) => {
    methodLockRef.current = next;
    setOnlineLocked(next);
    props.onLockChange?.(next);
  };
  const selectMethod = (next: Method) => {
    if (!methodLockRef.current) setMethod(next);
  };
  return <div>
    <div className={styles.methods} role="group" aria-label="Choose donation method">
      <button type="button" aria-pressed={method==="RAZORPAY"} disabled={methodLocked} onClick={()=>selectMethod("RAZORPAY")}>Secure online payment</button>
      <button type="button" aria-pressed={method==="DIRECT_UPI"} disabled={methodLocked} onClick={()=>selectMethod("DIRECT_UPI")}>Direct UPI / QR</button>
      <button type="button" aria-pressed={method==="BANK_TRANSFER"} disabled={methodLocked} onClick={()=>selectMethod("BANK_TRANSFER")}>Bank transfer</button>
    </div>
    <div>
      {method==="RAZORPAY" ? <DonationForm appealId={props.appealId} fundSlug={props.fundSlug} feeBps={props.feeBps} extraFields={props.extraFields} campaign={props.campaign} sponsorship={props.sponsorship} appealTitle={props.appealTitle} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} copy={props.copy} onLockChange={onOnlineLockChange}/> : <DirectTransferForm key={method} appealId={props.appealId} fundSlug={props.fundSlug} extraFields={props.extraFields} campaign={props.campaign} sponsorship={props.sponsorship} maxAmount={props.maxAmount} method={method} paymentDetails={props.paymentDetails} onLockChange={onTransferLockChange} copy={props.copy.direct}/>} 
    </div>
  </div>;
}

export type ReviewedAppealChoice = {
  id: string;
  slug: string;
  title: string;
  maxAmount: number;
  zakatEligible: boolean;
  copy: DonationFormCopy;
};

/** Server-approved appeals only. Never infer payment eligibility from this view;
 * the order/transfer endpoints perform their own fresh financial checks. */
export function AppealLandingCheckout({ appeals, paymentDetails }: {
  appeals: readonly ReviewedAppealChoice[];
  paymentDetails: DonationPaymentDetails;
}) {
  const eligible = appeals.filter(appeal =>
    Boolean(appeal.id.trim() && appeal.title.trim()) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appeal.slug) &&
    getWholeRupeeCheckoutRange(appeal.maxAmount) !== null,
  ).slice(0, 4);
  const [selectedId, setSelectedId] = useState(eligible[0]?.id ?? "");
  const [locked, setLocked] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const lockRef = useRef(false);
  const handleLockChange = useCallback((value: boolean) => {
    lockRef.current = value;
    setLocked(value);
  }, []);
  const selected = eligible.find(appeal => appeal.id === selectedId) ?? eligible[0];
  if (!selected) return null;

  const styles = selected.copy.methodClasses;
  const single = eligible.length === 1;
  return <section id="choose-appeal-checkout" className={styles.landing} aria-labelledby="choose-appeal-checkout-title">
    <span className="v2-section-label">Currently reviewed giving destinations</span>
    <h2 className="v2-section-title" id="choose-appeal-checkout-title">{single ? "Give to this verified appeal." : "Choose an appeal and give on this page."}</h2>
    <p className={styles.landingLead}>{single ? "The remaining need shown is verified. " : "Each appeal has its own verified remaining need. Review the case before selecting a destination. "}The payment server checks the latest approval and balance again before any online order.</p>
    <GivingNoScriptNotice />
    <div className={styles.appealGrid} role="group" aria-label={single ? "Reviewed appeal" : "Choose a reviewed appeal"}>
      {eligible.map(appeal => <div key={appeal.id} className={styles.appealItem}>
        {single ? <div className={`${styles.appealCard} ${styles.appealCardSelected}`}>
          <strong>{appeal.title}</strong>
          <span>{formatCheckoutRemainingINR(appeal.maxAmount)} remaining</span>
        </div> : <button
          type="button"
          className={`${styles.appealCard} ${appeal.id === selected.id ? styles.appealCardSelected : ""}`}
          aria-pressed={appeal.id === selected.id}
          aria-label={`Select ${appeal.title}, with ${formatCheckoutRemainingINR(appeal.maxAmount)} remaining`}
          disabled={locked}
          onClick={() => { if (!lockRef.current) { setSelectedId(appeal.id); setCheckoutRequested(false); } }}
        >
          <strong>{appeal.title}</strong>
          <span>{formatCheckoutRemainingINR(appeal.maxAmount)} remaining</span>
        </button>}
        <Link className="v2-text-link" href={`/appeals/${appeal.slug}`}>Review this appeal <span aria-hidden="true">↗</span></Link>
      </div>)}
    </div>
    {(!single || locked) && <p className={styles.landingStatus} role="status" aria-live="polite">{locked
      ? "Payment or verification in progress; destination changes are disabled."
      : <>Selected: <strong>{selected.title}</strong></>}</p>}
    <button type="button" className={checkoutRequested ? "v2-button v2-button--paper-secondary" : "v2-button"} aria-expanded={checkoutRequested}
      aria-controls="reviewed-appeal-payment-methods" disabled={locked}
      onClick={() => { if (!lockRef.current) setCheckoutRequested(true); }}>
      {checkoutRequested ? "Payment methods ready below" : "Continue to payment methods"}
    </button>
    <div id="reviewed-appeal-payment-methods" className={checkoutRequested ? styles.landingMethods : undefined}>
      {checkoutRequested && <>
        <DonationMethods key={selected.id} appealId={selected.id} appealTitle={selected.title}
          maxAmount={selected.maxAmount} zakatEligible={selected.zakatEligible}
          paymentDetails={paymentDetails} copy={selected.copy}
          onLockChange={handleLockChange} />
      </>}
    </div>
  </section>;
}
