"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";

type Method = "DIRECT_UPI" | "BANK_TRANSFER";

export function DirectTransferForm({ appealId, maxAmount, zakatEligible, method, paymentDetails }: { appealId: string; maxAmount: number; zakatEligible: boolean; method: Method; paymentDetails: DonationPaymentDetails }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const transactionMax = Math.min(maxAmount, 1_000_000);
  const transactionMin = transactionMax < 10 ? transactionMax : 10;
  const bankUnavailable = method === "BANK_TRANSFER" && !paymentDetails.bank;
  const upiUri = `upi://pay?pa=${encodeURIComponent(paymentDetails.upi.id)}&pn=${encodeURIComponent("AMAANA FOUNDATION")}&cu=INR`;

  async function copy(value: string) { await navigator.clipboard.writeText(value); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const values = new FormData(event.currentTarget);
      values.set("appealId", appealId); values.set("paymentMethod", method);
      values.set("isAnonymous", values.get("isAnonymous") === "on" ? "true" : "false");
      values.set("domesticConfirmed", values.get("domesticConfirmed") === "on" ? "true" : "false");
      const response = await fetch("/api/donations/direct-transfer", { method: "POST", body: values });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not submit this transfer for verification.");
      router.push(privateDonationAcknowledgementPath(result.referenceNumber, result.receiptToken));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not submit this transfer for verification."); setBusy(false); }
  }

  return <div className="v2-premium-form v2-donation-form">
    <div className="v2-form-heading"><span>{method === "DIRECT_UPI" ? "Direct UPI" : "Bank transfer"}</span><h2>{method === "DIRECT_UPI" ? "Pay Amaana directly by UPI." : "Transfer directly to Amaana Foundation."}</h2><p>Complete the transfer using the verified details below, then submit the UTR/reference so Amaana can reconcile it. Your appeal total changes only after verification.</p></div>
    {method === "DIRECT_UPI" ? <section className="card" aria-label="Verified UPI details"><p><strong>UPI ID</strong><br/><code>{paymentDetails.upi.id}</code></p><p><button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.upi.id)}>Copy UPI ID</button> · <a className="v2-text-link" href={upiUri}>Open UPI app</a></p>{paymentDetails.upi.qrImageUrl ? <Image src={paymentDetails.upi.qrImageUrl} alt="Amaana Foundation verified UPI payment QR code" width={240} height={240} priority={false}/> : <p className="form-error">Verified QR image is not configured yet. Use the UPI ID above; the site will not display an unverified QR.</p>}</section> : paymentDetails.bank ? <section className="card" aria-label="Verified bank transfer details"><dl className="details"><div><dt>Account name</dt><dd>{paymentDetails.bank.accountName}</dd></div><div><dt>Account number</dt><dd>{paymentDetails.bank.accountNumber} <button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.bank!.accountNumber)}>Copy</button></dd></div><div><dt>IFSC</dt><dd>{paymentDetails.bank.ifsc} <button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.bank!.ifsc)}>Copy</button></dd></div><div><dt>Bank</dt><dd>{paymentDetails.bank.bankName}</dd></div><div><dt>Branch</dt><dd>{paymentDetails.bank.branch}</dd></div></dl></section> : <div className="form-error" role="alert">Official bank-transfer details are not configured. Amaana will not display guessed or incomplete banking information.</div>}
    <form onSubmit={submit} className="form-grid" aria-busy={busy}>
      {error && <div className="form-error field full" role="alert">{error}</div>}
      <div className="field"><label htmlFor={`direct-name-${method}`}>Full name</label><input id={`direct-name-${method}`} name="donorName" autoComplete="name" minLength={2} required disabled={busy || bankUnavailable}/></div>
      <div className="field"><label htmlFor={`direct-email-${method}`}>Email</label><input id={`direct-email-${method}`} name="donorEmail" type="email" autoComplete="email" required disabled={busy || bankUnavailable}/></div>
      <div className="field"><label htmlFor={`direct-phone-${method}`}>Phone <span className="muted">optional</span></label><input id={`direct-phone-${method}`} name="donorPhone" type="tel" autoComplete="tel" disabled={busy || bankUnavailable}/></div>
      <div className="field"><label htmlFor={`direct-amount-${method}`}>Amount (INR)</label><input id={`direct-amount-${method}`} name="amount" type="number" min={transactionMin} max={transactionMax} step="1" inputMode="numeric" required disabled={busy || bankUnavailable}/></div>
      <div className="field"><label htmlFor={`direct-reference-${method}`}>UTR / transaction reference</label><input id={`direct-reference-${method}`} name="transferReference" minLength={6} maxLength={100} required disabled={busy || bankUnavailable}/></div>
      <div className="field"><label htmlFor={`direct-date-${method}`}>Transfer date and time</label><input id={`direct-date-${method}`} name="transferredAt" type="datetime-local" required disabled={busy || bankUnavailable}/></div>
      <div className="field full"><label htmlFor={`direct-evidence-${method}`}>Screenshot / receipt <span className="muted">optional, max 5 MB</span></label><input id={`direct-evidence-${method}`} name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy || bankUnavailable}/><small>Supporting evidence only. It does not prove receipt until an Amaana administrator verifies the transfer.</small></div>
      <fieldset className="field full" disabled={busy || bankUnavailable}><legend>Giving intention</legend>{(["GENERAL","SADAQAH",...(zakatEligible?["ZAKAT"]:[])] as DonationIntentValue[]).map((intent,index)=><label className="checkbox" key={intent}><input type="radio" name="givingIntent" value={intent} defaultChecked={index===0}/><span><strong>{DONATION_INTENT_LABELS[intent]}</strong><small>{DONATION_INTENT_DESCRIPTIONS[intent]}</small></span></label>)}</fieldset>
      <div className="field full"><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={busy || bankUnavailable}/><span><strong>Keep my public identity private</strong></span></label></div>
      <div className="field full"><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required disabled={busy || bankUnavailable}/><span><strong>Domestic contribution confirmation</strong><small>I confirm this contribution is from an Indian source using a domestic account/payment method.</small></span></label></div>
      <div className="field full"><button className="v2-button" type="submit" disabled={busy || bankUnavailable}>{busy ? "Submitting for verification…" : "Submit transfer for verification"}</button><small>This submission remains Pending Verification until Amaana matches it to the Foundation&apos;s received funds.</small></div>
    </form>
  </div>;
}
