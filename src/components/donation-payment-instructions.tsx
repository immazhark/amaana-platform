import "server-only";
import Image from "next/image";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { PaymentCopyAction } from "./payment-copy-action";

export function DonationPaymentInstructions({ method, paymentDetails }: { method: "DIRECT_UPI" | "BANK_TRANSFER"; paymentDetails: DonationPaymentDetails }) {
  const upi = method === "DIRECT_UPI";
  const bank = paymentDetails.bank;
  const upiUri = `upi://pay?pa=${encodeURIComponent(paymentDetails.upi.id)}&pn=${encodeURIComponent("AMAANA FOUNDATION")}&cu=INR`;
  return <>
    <div className="v2-form-heading"><span>{upi ? "Direct UPI" : "Bank transfer"}</span><h2 id="donation-form-heading">{upi ? "Pay Amaana directly by UPI." : "Transfer directly to Amaana Foundation."}</h2><p>Complete the transfer using the verified details below, then submit the UTR/reference so Amaana can reconcile it. Your appeal total changes only after verification.</p></div>
    {upi ? <section className="card" aria-label="Verified UPI details">
      <p><strong>UPI ID</strong><br/><code>{paymentDetails.upi.id}</code></p>
      <p><PaymentCopyAction value={paymentDetails.upi.id} label="UPI ID" text="Copy UPI ID"/> · <a className="v2-text-link" href={upiUri}>Open UPI app</a></p>
      {paymentDetails.upi.qrImageUrl ? <Image src={paymentDetails.upi.qrImageUrl} alt="Amaana Foundation verified UPI payment QR code" width={240} height={240} priority={false}/> : <p className="form-error">Verified QR image is not configured yet. Use the UPI ID above; the site will not display an unverified QR.</p>}
    </section> : bank ? <section className="card" aria-label="Verified bank transfer details"><dl className="details">
      <div><dt>Account name</dt><dd>{bank.accountName}</dd></div>
      <div><dt>Account number</dt><dd>{bank.accountNumber} <PaymentCopyAction value={bank.accountNumber} label="Account number"/></dd></div>
      <div><dt>IFSC</dt><dd>{bank.ifsc} <PaymentCopyAction value={bank.ifsc} label="IFSC"/></dd></div>
      <div><dt>Bank</dt><dd>{bank.bankName}</dd></div>
      <div><dt>Branch</dt><dd>{bank.branch}</dd></div>
    </dl></section> : <div className="form-error" role="alert">Official bank-transfer details are not configured. Amaana will not display guessed or incomplete banking information.</div>}
  </>;
}
