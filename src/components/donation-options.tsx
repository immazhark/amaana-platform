import "server-only";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { Suspense } from "react";
import { DonationMethods } from "./donation-checkout";
import { DonationPaymentInstructions } from "./donation-payment-instructions";

export function DonationOptions({ paymentDetails, ...props }: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible: boolean; paymentDetails: DonationPaymentDetails }) {
  return <Suspense fallback={<p role="status">Preparing secure donation methods…</p>}><DonationMethods {...props} bankAvailable={Boolean(paymentDetails.bank)} paymentInstructions={{
    DIRECT_UPI: <DonationPaymentInstructions method="DIRECT_UPI" paymentDetails={paymentDetails}/>,
    BANK_TRANSFER: <DonationPaymentInstructions method="BANK_TRANSFER" paymentDetails={paymentDetails}/>,
  }}/></Suspense>;
}
