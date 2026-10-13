"use client";

import { useCallback, useRef, useState } from "react";
import { DonationForm } from "@/components/donation-form";
import { DirectTransferForm } from "@/components/direct-transfer-form";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import styles from "./donation-methods.module.css";

type Method = "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
export function DonationMethods(props: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible: boolean; paymentDetails: DonationPaymentDetails }) {
  const [method,setMethod]=useState<Method>("RAZORPAY");
  const [methodLocked, setMethodLocked] = useState(false);
  const submissionLock = useRef(false);
  const updateSubmissionLock = useCallback((locked: boolean) => {
    submissionLock.current = locked;
    setMethodLocked(locked);
  }, []);
  function chooseMethod(next: Method) {
    if (!submissionLock.current) setMethod(next);
  }
  return <div>
    <div className={styles.methods} role="group" aria-label="Choose donation method">
      <button type="button" disabled={methodLocked} aria-pressed={method==="RAZORPAY"} onClick={()=>chooseMethod("RAZORPAY")}>Secure online payment</button>
      <button type="button" disabled={methodLocked} aria-pressed={method==="DIRECT_UPI"} onClick={()=>chooseMethod("DIRECT_UPI")}>Direct UPI / QR</button>
      <button type="button" disabled={methodLocked} aria-pressed={method==="BANK_TRANSFER"} onClick={()=>chooseMethod("BANK_TRANSFER")}>Bank transfer</button>
    </div>
    <div>
      {method==="RAZORPAY" ? <DonationForm appealId={props.appealId} appealTitle={props.appealTitle} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} onSubmissionLockChange={updateSubmissionLock}/> : <DirectTransferForm appealId={props.appealId} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} method={method} paymentDetails={props.paymentDetails} onSubmissionLockChange={updateSubmissionLock}/>}
    </div>
  </div>;
}
