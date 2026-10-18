"use client";

import { useState } from "react";
import { DonationForm } from "@/components/donation-form";
import type { DonationFormCopy } from "@/components/donation-form-copy";
import { DirectTransferForm } from "@/components/direct-transfer-form";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import styles from "./donation-methods.module.css";

type Method = "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
export function DonationMethods(props: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible: boolean; paymentDetails: DonationPaymentDetails; copy: DonationFormCopy }) {
  const [method,setMethod]=useState<Method>("RAZORPAY");
  const [transferLocked,setTransferLocked]=useState(false);
  return <div>
    <div className={styles.methods} role="group" aria-label="Choose donation method">
      <button type="button" aria-pressed={method==="RAZORPAY"} disabled={transferLocked} onClick={()=>setMethod("RAZORPAY")}>Secure online payment</button>
      <button type="button" aria-pressed={method==="DIRECT_UPI"} disabled={transferLocked} onClick={()=>setMethod("DIRECT_UPI")}>Direct UPI / QR</button>
      <button type="button" aria-pressed={method==="BANK_TRANSFER"} disabled={transferLocked} onClick={()=>setMethod("BANK_TRANSFER")}>Bank transfer</button>
    </div>
    <div>
      {method==="RAZORPAY" ? <DonationForm appealId={props.appealId} appealTitle={props.appealTitle} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} copy={props.copy}/> : <DirectTransferForm appealId={props.appealId} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} method={method} paymentDetails={props.paymentDetails} onLockChange={setTransferLocked}/>} 
    </div>
  </div>;
}
