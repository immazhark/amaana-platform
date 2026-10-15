"use client";

import { Suspense, type ReactNode, useCallback, useRef, useState } from "react";
import { LazyDonationForm as DonationForm, LazyDirectTransferForm as DirectTransferForm } from "./donation-checkout-loaders";
import styles from "./donation-methods.module.css";

type Method = "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
export function DonationMethods(props: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible: boolean; bankAvailable: boolean; paymentInstructions: Record<Exclude<Method, "RAZORPAY">, ReactNode>;
  onSubmissionLockChange?: (locked: boolean) => void }) {
  const { onSubmissionLockChange } = props;
  const [method,setMethod]=useState<Method>("RAZORPAY");
  const [methodLocked, setMethodLocked] = useState(false);
  const submissionLock = useRef(false);
  const updateSubmissionLock = useCallback((locked: boolean) => {
    submissionLock.current = locked;
    setMethodLocked(locked);
    onSubmissionLockChange?.(locked);
  }, [onSubmissionLockChange]);
  function chooseMethod(next: Method) {
    if (!submissionLock.current && (next !== "BANK_TRANSFER" || props.bankAvailable)) setMethod(next);
  }
  return <div>
    <div className={styles.methods} role="group" aria-label="Choose donation method">
      <button type="button" disabled={methodLocked} aria-pressed={method==="RAZORPAY"} onClick={()=>chooseMethod("RAZORPAY")}>Secure online payment</button>
      <button type="button" disabled={methodLocked} aria-pressed={method==="DIRECT_UPI"} onClick={()=>chooseMethod("DIRECT_UPI")}>Direct UPI / QR</button>
      <button type="button" disabled={methodLocked || !props.bankAvailable} aria-pressed={method==="BANK_TRANSFER"} aria-label={!props.bankAvailable ? "Bank transfer (unavailable)" : undefined} onClick={()=>chooseMethod("BANK_TRANSFER")}>Bank transfer</button>
    </div>
    {!props.bankAvailable && <p className="muted">Bank transfer is unavailable right now. Please use secure online payment or Direct UPI / QR.</p>}
    <div>
      <Suspense fallback={<p role="status">Preparing secure donation form…</p>}>{method==="RAZORPAY" ? <DonationForm appealId={props.appealId} appealTitle={props.appealTitle} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} onSubmissionLockChange={updateSubmissionLock}/> : <DirectTransferForm key={method} appealId={props.appealId} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} method={method} instructions={props.paymentInstructions[method]} bankAvailable={props.bankAvailable} onSubmissionLockChange={updateSubmissionLock}/>}</Suspense>
    </div>
  </div>;
}
