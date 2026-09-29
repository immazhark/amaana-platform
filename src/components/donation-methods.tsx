"use client";

import { useState } from "react";
import { DonationForm } from "@/components/donation-form";
import { DirectTransferForm } from "@/components/direct-transfer-form";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";

type Method = "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
export function DonationMethods(props: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible: boolean; paymentDetails: DonationPaymentDetails }) {
  const [method,setMethod]=useState<Method>("RAZORPAY");
  return <div>
    <div className="filter-row" role="tablist" aria-label="Choose donation method">
      <button type="button" role="tab" aria-selected={method==="RAZORPAY"} onClick={()=>setMethod("RAZORPAY")}>Secure online payment</button>
      <button type="button" role="tab" aria-selected={method==="DIRECT_UPI"} onClick={()=>setMethod("DIRECT_UPI")}>Direct UPI / QR</button>
      <button type="button" role="tab" aria-selected={method==="BANK_TRANSFER"} onClick={()=>setMethod("BANK_TRANSFER")}>Bank transfer</button>
    </div>
    <div role="tabpanel">
      {method==="RAZORPAY" ? <DonationForm appealId={props.appealId} appealTitle={props.appealTitle} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible}/> : <DirectTransferForm appealId={props.appealId} maxAmount={props.maxAmount} zakatEligible={props.zakatEligible} method={method} paymentDetails={props.paymentDetails}/>} 
    </div>
  </div>;
}
