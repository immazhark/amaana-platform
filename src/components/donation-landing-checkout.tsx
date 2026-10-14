"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { AppealDonationFlow, type AppealDonationChoice } from "@/components/appeal-donation-flow";
import { FundDonationFlow } from "@/components/fund-donation-flow";
import type { DonorFund } from "@/lib/fund-checkout-contract";
import styles from "./donation-landing-checkout.module.css";

type Props = {
  appeals: readonly AppealDonationChoice[];
  funds: readonly DonorFund[];
  bankAvailable: boolean;
  paymentInstructions: { DIRECT_UPI: ReactNode; BANK_TRANSFER: ReactNode };
};

/** Exactly one checkout form in the DOM avoids duplicated field IDs, amount
 * controls and ARIA relations. Lock both route and appeal/fund selection while
 * payment confirmation or direct transfer reconciliation is in flight. */
export function DonationLandingCheckout({ appeals, funds, bankAvailable, paymentInstructions }: Props) {
  const hasAppeals = appeals.length > 0;
  const hasFunds = funds.length > 0;
  const [route, setRoute] = useState<"appeal" | "fund">(hasAppeals ? "appeal" : "fund");
  const [locked, setLocked] = useState(false);
  const lockRef = useRef(false);
  const changeLock = useCallback((value: boolean) => {
    lockRef.current = value;
    setLocked(value);
  }, []);
  if (!hasAppeals && !hasFunds) return null;

  const selected = route === "appeal" && hasAppeals ? "appeal" :
    route === "fund" && hasFunds ? "fund" : hasAppeals ? "appeal" : "fund";
  return <section id="donation-route-choice" className={styles.root} aria-label="Available donation checkouts">
    {hasAppeals && hasFunds && <>
      <h2 className={styles.heading}>Choose your giving route</h2>
      <div role="group" aria-label="Choose a donation destination" className={styles.tabs}>
        <button type="button" aria-pressed={selected === "appeal"}
          disabled={locked} onClick={() => { if (!lockRef.current) setRoute("appeal"); }}>
          Support an active appeal
        </button>
        <button type="button" aria-pressed={selected === "fund"}
          disabled={locked} onClick={() => { if (!lockRef.current) setRoute("fund"); }}>
          Support an approved fund
        </button>
      </div>
    </>}
    {selected === "appeal"
      ? <AppealDonationFlow appeals={appeals} bankAvailable={bankAvailable}
          paymentInstructions={paymentInstructions} onSubmissionLockChange={changeLock}/>
      : <div className={styles.fund}><FundDonationFlow funds={funds}
          onSubmissionLockChange={changeLock}/></div>}
  </section>;
}
